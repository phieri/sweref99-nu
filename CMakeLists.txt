cmake_minimum_required(VERSION 3.8)

project(sr9)

set(PROJ_ROOT "${CMAKE_SOURCE_DIR}/libs/proj")
set(PROJ_INCLUDE_DIR "${PROJ_ROOT}/include")
set(PROJ_LIB_DIR "${PROJ_ROOT}/lib")

include_directories(${PROJ_INCLUDE_DIR})
link_directories(${PROJ_LIB_DIR})

find_package(PROJ REQUIRED CONFIG)
target_link_libraries(MyApp PRIVATE PROJ::proj)
