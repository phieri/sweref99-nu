# GPS Threshold Research and Documentation

This document explains the scientifically sound values chosen for the position accuracy and speed thresholds used in the sweref99-nu application.

## Position Accuracy Threshold

### Value: 5 meters

### Scientific Basis

Smartphone GPS accuracy varies significantly based on environmental conditions and hardware quality. Research shows:

1. **Optimal Conditions**: Modern smartphones typically achieve 3-5 meters positional accuracy when they have clear view of the sky and good satellite geometry.

2. **Real-world Conditions**: In typical urban environments with buildings, trees, or other obstructions, accuracy degrades to 10-20 meters.

3. **SWEREF 99 Transformation**: The transformation between WGS 84 (used by GPS) and SWEREF 99 TM maintains accuracy within 1 meter, as specified by Lantmäteriet.

4. **Measurement Standard Deviation**: Studies show positional standard deviation ranging from 1.8 to 2.2 meters depending on observation mode.

### Rationale

The 5-meter threshold represents typical **optimal** smartphone GPS accuracy. This value:
- Is appropriate for general navigation and coordinate display purposes
- Provides a reasonable indication of positioning quality to users
- Marks the boundary between good and degraded signal conditions
- Aligns with the app's use case for fieldwork, navigation, and casual coordinate determination

Values below 5m indicate good GPS signal quality, while values above suggest the user should seek better conditions (e.g., moving away from obstructions) for more reliable coordinates.

### Sources

- Link, J. et al. (2025). "Improving smartphone precise positioning based on a new weighting strategy." *Springer*. https://link.springer.com/article/10.1007/s10291-025-01901-0
- DXOMark GPS Testing. "GPS on smartphones: Testing the accuracy of location positioning." https://www.dxomark.com/gps-on-your-smartphone-why-youre-not-always-there-when-it-says-youre-there/
- "Accuracy and Reliability of Smartphones GNSS Applications: A Comparative Study." *World Scientific News*. https://worldscientificnews.com/
- Lantmäteriet. "Swedish reference systems." https://www2.lantmateriet.se/en/geodata/gps-geodesy-and-swepos/swedish-reference-systems/

## Speed Threshold

### Value: 1.4 m/s (approximately 5 km/h)

### Scientific Basis

The speed threshold needs to distinguish between stationary or slowly moving users (pedestrians) and faster travel modes (cycling, driving):

1. **Pedestrian Walking Speeds**: Research shows typical pedestrian walking speeds range from 1.1 to 1.4 m/s (4-5 km/h).

2. **GPS Noise When Stationary**: When a device is stationary, GPS positioning errors cause apparent movement. The position "drifts" due to signal noise, creating spurious velocity readings typically on the order of 0.5-1.0 m/s.

3. **Speed Measurement Accuracy**: GPS speed accuracy degrades at low velocities. The error is relatively higher for pedestrian speeds compared to vehicular speeds.

4. **Use Cases**: The application needs to indicate when position updates might be unreliable due to movement. Fast movement (>1.4 m/s) can indicate:
   - User is cycling or in a vehicle
   - Position updates may lag behind actual position
   - Coordinates may be less useful for precise work

### Rationale

The 1.4 m/s threshold:
- Represents the upper bound of normal walking speed
- Effectively distinguishes walking from faster movement modes
- Reduces false positives from GPS noise when stationary
- Provides useful feedback when the user is moving too fast for reliable coordinate work

The "outofrange" indicator helps users understand when their movement speed may affect the usefulness of the displayed coordinates.

### Sources

- "Pedestrian Walking Speed Analysis: A Systematic Review." *MDPI Sustainability* 16(11):4813 (2024). https://www.mdpi.com/2071-1050/16/11/4813
- Transportation Research Board. "Walking Speeds of Elderly." *Transportation Research Record* 1487 (1995). https://onlinepubs.trb.org/Onlinepubs/trr/1995/1487/1487-010.pdf
- "A Framework for Assessing Pedestrian Exposure Using GPS." Federal Highway Administration. https://rosap.ntl.bts.gov/view/dot/75681/

## Implementation

These thresholds are implemented as named constants in `src/script.ts`:

```typescript
const ACCURACY_THRESHOLD_METERS: number = 5;
const SPEED_THRESHOLD_MS: number = 1.4;
```

When either threshold is exceeded, the corresponding display element receives the CSS class `outofrange`, which can be styled to provide visual feedback to users.

## Future Considerations

These thresholds were chosen based on current (2025) smartphone GPS technology and typical use cases. They may need adjustment if:

1. Smartphone GPS technology improves significantly (e.g., widespread adoption of multi-frequency GNSS)
2. User feedback indicates the thresholds are not optimal for real-world usage
3. The application's use cases change (e.g., requiring higher precision)
4. New research provides better insights into optimal threshold values

Any future changes should be similarly researched and documented.
