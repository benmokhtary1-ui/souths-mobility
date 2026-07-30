import pandas as pd
import json

def process_fusion_data():
    print("🚀 Démarrage de l'Usine à Données (Fusion Systématique UNDESA + OIT)...")
    
    # Le dictionnaire maître absolu des 54 pays
    ilo_to_un_codes = {
        'Algeria': '12', 'Angola': '24', 'Benin': '204', 'Botswana': '72', 'Burkina Faso': '854',
        'Burundi': '108', 'Cabo Verde': '132', 'Cameroon': '120', 'Central African Republic': '140',
        'Chad': '148', 'Comoros': '174', 'Congo': '178', "Côte d'Ivoire": '384',
        'Congo, Democratic Republic of the': '180', 'Djibouti': '262', 'Egypt': '818',
        'Equatorial Guinea': '226', 'Eritrea': '232', 'Eswatini': '748', 'Ethiopia': '231',
        'Gabon': '266', 'Gambia': '270', 'Ghana': '288', 'Guinea': '324', 'Guinea-Bissau': '624',
        'Kenya': '404', 'Lesotho': '426', 'Liberia': '430', 'Libya': '434', 'Madagascar': '450',
        'Malawi': '454', 'Mali': '466', 'Mauritania': '478', 'Mauritius': '480', 'Morocco': '504',
        'Mozambique': '508', 'Namibia': '516', 'Niger': '562', 'Nigeria': '566', 'Rwanda': '646',
        'Sao Tome and Principe': '678', 'Senegal': '686', 'Seychelles': '690', 'Sierra Leone': '694',
        'Somalia': '706', 'South Africa': '710', 'South Sudan': '728', 'Sudan': '729', 'Togo': '768',
        'Tunisia': '788', 'Uganda': '800', 'Tanzania, United Republic of': '834', 'Zambia': '894', 'Zimbabwe': '716'
    }
    
    # 1. Extraction OIT
    labour_data = {}
    try:
        df_lab = pd.read_excel('Labour_force_by_international_migrant_status.xlsx', sheet_name='4. Participation rate by sex', skiprows=4, header=None)
        for _, row in df_lab.iterrows():
            c_name = str(row[2]).strip()
            if c_name in ilo_to_un_codes and str(row[4]).strip() == 'Total' and str(row[5]).strip() == 'Migrants':
                labour_data[ilo_to_un_codes[c_name]] = str(row[6]).strip()
    except Exception as e:
        print(f"❌ Erreur OIT : {e}")

    # 2. Extraction UNDESA
    undesa_data = {}
    try:
        df_un = pd.read_excel('undesa_pd_2024_ims_stock_by_sex_destination_and_origin (1).xlsx', sheet_name='Table 1', skiprows=10)
        df_un.columns = df_un.columns.astype(str).str.strip()
        target_col = 'Location code of destination'
        df_un[target_col] = pd.to_numeric(df_un[target_col], errors='coerce')
        
        # On extrait tout
        for _, row in df_un.iterrows():
            code = str(row[target_col]).replace('.0', '')
            val = str(row['2024']) if '2024' in df_un.columns else str(row[2024])
            undesa_data[code] = val
    except Exception as e:
        print(f"❌ Erreur UNDESA : {e}")

    # 3. FUSION SYSTÉMATIQUE (On force les 54 pays)
    results = {}
    missing_labour = []
    
    for name_eng, un_code in ilo_to_un_codes.items():
        stock_val = undesa_data.get(un_code, "N/A")
        emp_rate = labour_data.get(un_code, "N/A")
        
        if emp_rate == "N/A":
            missing_labour.append(name_eng)
            
        results[un_code] = {
            "id": un_code,
            "name": {"fr": name_eng, "en": name_eng}, # Vous pourrez affiner les traductions FR plus tard
            "stock": stock_val,
            "labour_participation": emp_rate,
            "history": [{"year": 2024, "value": stock_val}]
        }
        
    with open('countryData_fusion.js', 'w', encoding='utf-8') as f:
        f.write("export const countryData = " + json.dumps(results, indent=2, ensure_ascii=False) + ";\n")
        
    print(f"\n✅ AUDIT : Fichier généré avec exactement {len(results)} pays.")
    if missing_labour:
        print(f"⚠️ Note : L'OIT n'a pas de données d'emploi pour : {', '.join(missing_labour)} (La valeur 'N/A' a été insérée).")

if __name__ == "__main__":
    process_fusion_data()