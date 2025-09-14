#!/usr/bin/env python3
"""
Optimize proj.db by removing unwanted coordinate systems using a subtractive approach.
This script identifies Swedish coordinate systems and removes all others.

Swedish coordinate systems to keep:
- EPSG:4326 - WGS 84 (worldwide reference, needed for GPS)
- EPSG:3006 - SWEREF99 TM (Swedish national grid)
- EPSG:4619 - SWEREF99 (Swedish geodetic reference)
- Related dependencies (ellipsoids, datums, etc.)
"""

import sqlite3
import sys
import os

def get_swedish_coordinate_systems():
    """Define the coordinate systems needed for Swedish applications"""
    return {
        # Hardcoded IDs based on dependency analysis to avoid runtime computation
        # Note: 'conversion' is excluded as it's a view in PROJ databases, not a table
        'geodetic_crs': ['4326', '4619'],
        'projected_crs': ['3006'],
        'geodetic_datum': ['6326', '6619'],
        'ellipsoid': ['7030', '7019'],
        'prime_meridian': ['8901'],
        'unit_of_measure': ['9001', '9102'],
        'celestial_body': ['PROJ:EARTH'],
        'coordinate_system': ['6422', '4500'],
        'extent': ['2830', '1225'],
        'scope': ['1183', '1210'],
        'usage': []  # Will be computed based on the above entries
    }

def get_hardcoded_dependencies():
    """Return hardcoded dependencies instead of runtime analysis for performance"""
    return get_swedish_coordinate_systems()

def optimize_proj_db(input_path, output_path=None):
    """Remove unwanted entries from proj.db keeping only Swedish coordinate systems"""
    if output_path is None:
        output_path = input_path
    
    # Use hardcoded dependencies for performance
    print("Using hardcoded dependencies for Swedish coordinate systems...")
    needed_ids = get_hardcoded_dependencies()
    
    # Print what we're keeping
    total_kept = 0
    for table_name, ids in needed_ids.items():
        if ids:
            print(f"Keeping {len(ids)} entries in {table_name}: {ids[:5]}{'...' if len(ids) > 5 else ''}")
            total_kept += len(ids)
    
    print(f"Total entries to keep: {total_kept}")
    
    # Get original size
    original_size = os.path.getsize(input_path)
    print(f"Original database size: {original_size:,} bytes")
    
    # Create optimized database
    conn = sqlite3.connect(input_path)
    
    # Get list of actual tables vs views
    cursor = conn.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view')")
    db_objects = {name: obj_type for name, obj_type in cursor.fetchall()}
    
    print("\nDatabase objects found:")
    for name, obj_type in sorted(db_objects.items()):
        if name in needed_ids:
            print(f"  {obj_type}: {name}")
    
    # Count original entries (only for tables and views that exist)
    original_counts = {}
    for table_name in needed_ids.keys():
        if table_name in db_objects:
            try:
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
                original_counts[table_name] = cursor.fetchone()[0]
            except sqlite3.Error as e:
                print(f"Warning: Could not count {table_name}: {e}")
                original_counts[table_name] = 0
    
    # Remove unwanted entries (only from tables, not views)
    removed_counts = {}
    for table_name, keep_ids in needed_ids.items():
        if not keep_ids:
            continue
            
        # Skip if not in database or is a view
        if table_name not in db_objects:
            print(f"Skipping {table_name}: not found in database")
            continue
            
        if db_objects[table_name] == 'view':
            print(f"Skipping {table_name}: is a view, cannot modify")
            continue
        
        try:
            if table_name == 'celestial_body':
                # Special handling for celestial_body (auth_name:code format)
                auth_codes = []
                for item in keep_ids:
                    if ':' in item:
                        auth, code = item.split(':', 1)
                        auth_codes.append((auth, code))
                
                if auth_codes:
                    placeholders = ','.join(['(?,?)'] * len(auth_codes))
                    flat_params = []
                    for auth, code in auth_codes:
                        flat_params.extend([auth, code])
                    
                    cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
                    before_count = cursor.fetchone()[0]
                    
                    conn.execute(f"""
                        DELETE FROM {table_name} 
                        WHERE (auth_name, code) NOT IN (VALUES {placeholders})
                    """, flat_params)
                    
                    cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
                    after_count = cursor.fetchone()[0]
                    removed_counts[table_name] = before_count - after_count
            else:
                # Regular tables with EPSG auth_name
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
                before_count = cursor.fetchone()[0]
                
                if table_name == 'usage':
                    # For usage table, we need to keep entries that reference our objects
                    keep_usage_sql = """
                        DELETE FROM usage WHERE NOT (
                            (object_table_name='geodetic_crs' AND object_auth_name='EPSG' AND object_code IN ({}))
                            OR (object_table_name='projected_crs' AND object_auth_name='EPSG' AND object_code IN ({}))
                        )
                    """.format(
                        ','.join('?' * len(needed_ids['geodetic_crs'])),
                        ','.join('?' * len(needed_ids['projected_crs']))
                    )
                    params = needed_ids['geodetic_crs'] + needed_ids['projected_crs']
                    conn.execute(keep_usage_sql, params)
                else:
                    placeholders = ','.join(['?'] * len(keep_ids))
                    conn.execute(f"""
                        DELETE FROM {table_name} 
                        WHERE auth_name='EPSG' AND code NOT IN ({placeholders})
                    """, keep_ids)
                
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
                after_count = cursor.fetchone()[0]
                removed_counts[table_name] = before_count - after_count
                
        except sqlite3.Error as e:
            print(f"Error processing {table_name}: {e}")
            removed_counts[table_name] = 0
    
    # Also handle metadata table - keep it as is
    cursor = conn.execute("SELECT COUNT(*) FROM metadata")
    metadata_count = cursor.fetchone()[0]
    print(f"Keeping all {metadata_count} metadata entries")
    
    conn.commit()
    conn.close()
    
    # Report results
    optimized_size = os.path.getsize(input_path)
    print(f"\nOptimization complete!")
    print(f"Optimized database size: {optimized_size:,} bytes")
    print(f"Size reduction: {original_size - optimized_size:,} bytes ({(1 - optimized_size/original_size)*100:.1f}%)")
    
    print(f"\nEntries removed by table:")
    total_removed = 0
    for table_name, removed_count in removed_counts.items():
        if removed_count > 0:
            original_count = original_counts.get(table_name, 0)
            kept_count = original_count - removed_count
            print(f"  {table_name}: {removed_count:,} removed, {kept_count} kept")
            total_removed += removed_count
    
    print(f"Total entries removed: {total_removed:,}")
    
    return optimized_size

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 optimize_proj_db.py <proj.db_path> [output_path]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(input_path):
        print(f"Error: Database file not found: {input_path}")
        sys.exit(1)
    
    optimize_proj_db(input_path, output_path)