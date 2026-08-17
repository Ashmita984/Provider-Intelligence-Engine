import math
from math import radians, sin, cos, sqrt, atan2
import pandas as pd
import numpy as np
from uszipcode import SearchEngine

def haversine(lat1, lon1, lat2, lon2):
    if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
        return np.nan
    R = 3959  # Earth radius in miles
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def clean_zip(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    s = ''.join(c for c in s if c.isdigit())
    if not s:
        return None
    if len(s) < 5:
        s = s.zfill(5)
    return s[:5]

def main():
    import os
    provider_paths = [
        "UC05_FINAL_DATA_WITH_DISEASE (2)/UC05_PROVIDER_FINAL_WITH_DISEASE.csv",
        "UC05_finalled_data/UC05_PROVIDER_FINAL.csv",
        "UC05_PROVIDER_FINAL.csv"
    ]
    p_path = next((p for p in provider_paths if os.path.exists(p)), None)
    if not p_path:
        raise FileNotFoundError("Could not find UC05_PROVIDER dataset!")
    print(f"Loading provider dataset from '{p_path}'...")
    df = pd.read_csv(p_path, dtype={'ZIP': str, 'COUNTY_FIPS': str})
    
    print(f"Total provider records loaded: {len(df)}")
    
    df['COUNTY_FIPS'] = df['COUNTY_FIPS'].astype(str).str.strip().str.split('.').str[0].str.zfill(5)
    df['CLEAN_ZIP'] = df['ZIP'].apply(clean_zip)
    
    unique_zips = df['CLEAN_ZIP'].dropna().unique()
    print(f"Total unique 5-digit ZIP codes in dataset: {len(unique_zips)}")
    
    print("Geocoding unique ZIP codes using uszipcode SearchEngine...")
    search = SearchEngine()
    
    zip_coords = {}
    success_count = 0
    failed_count = 0
    
    for z in unique_zips:
        res = search.by_zipcode(z)
        if res and res.lat is not None and res.lng is not None:
            zip_coords[z] = (res.lat, res.lng)
            success_count += 1
        else:
            zip_coords[z] = (np.nan, np.nan)
            failed_count += 1
            
    print("\n--- Geocoding Summary ---")
    print(f"Successfully geocoded ZIPs: {success_count}")
    print(f"Failed to geocode ZIPs: {failed_count}")
    
    df['LAT'] = df['CLEAN_ZIP'].map(lambda z: zip_coords.get(z, (np.nan, np.nan))[0])
    df['LNG'] = df['CLEAN_ZIP'].map(lambda z: zip_coords.get(z, (np.nan, np.nan))[1])
    
    # Calculate county population center as average (lat, lon) of all unique ZIP codes present in that county
    county_zips = df[['COUNTY_FIPS', 'CLEAN_ZIP', 'LAT', 'LNG']].dropna(subset=['LAT', 'LNG']).drop_duplicates(subset=['COUNTY_FIPS', 'CLEAN_ZIP'])
    county_pop_centers = county_zips.groupby('COUNTY_FIPS')[['LAT', 'LNG']].mean().rename(columns={'LAT': 'POP_LAT', 'LNG': 'POP_LNG'})
    
    df = df.merge(county_pop_centers, on='COUNTY_FIPS', how='left')
    
    print("Calculating haversine distances for each provider to county population center...")
    distances = [
        haversine(lat1, lon1, lat2, lon2)
        for lat1, lon1, lat2, lon2 in zip(df['LAT'], df['LNG'], df['POP_LAT'], df['POP_LNG'])
    ]
    df['distance_to_pop_center'] = distances
    
    print("Grouping by COUNTY_FIPS + PRIMARY SPECIALTY...")
    valid_dist_df = df.dropna(subset=['distance_to_pop_center'])
    
    grouped = valid_dist_df.groupby(['COUNTY_FIPS', 'PRIMARY_SPECIALTY']).agg(
        avg_distance_to_provider=('distance_to_pop_center', 'mean'),
        min_distance_to_provider=('distance_to_pop_center', 'min'),
        provider_count_in_county=('distance_to_pop_center', 'count')
    ).reset_index()
    
    output_filename = "UC05_geospatial_distances.csv"
    grouped.to_csv(output_filename, index=False)
    print(f"\nSuccessfully saved distance analysis to '{output_filename}'.")
    
    total_combinations = len(grouped)
    overall_avg_distance = grouped['avg_distance_to_provider'].mean()
    
    print("\n--- Summary Statistics ---")
    print(f"County-specialty combinations with distance data: {total_combinations}")
    print(f"Overall average distance to provider: {overall_avg_distance:.4f} miles")
    
    top_10_worst = grouped.sort_values(by='avg_distance_to_provider', ascending=False).head(10)
    
    print("\nTop 10 County-Specialty Combinations with LARGEST avg_distance_to_provider (Worst Geographic Access):")
    print(top_10_worst.to_string(index=False))
    
    print(f"\nCoverage Limitation: {failed_count} ZIP codes failed to geocode out of {len(unique_zips)} total unique ZIP codes.")

if __name__ == "__main__":
    main()
