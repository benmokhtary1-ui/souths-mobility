import pandas as pd
import json

def process_data():
    print("🚀 Démarrage de l'extraction des données UNDESA...")
    file_path = 'donnees-sources/undesa-2024-stock-par-origine-et-destination.xlsx'
    
    try:
        # 1. Chargement ciblé de l'onglet 'Table 1' en sautant les 10 premières lignes
        df = pd.read_excel(file_path, sheet_name='Table 1', skiprows=10)
        
        # 2. Nettoyage crucial des espaces invisibles dans les titres de colonnes
        df.columns = df.columns.astype(str).str.strip()
        
        target_col = 'Location code of destination'
        if target_col not in df.columns:
            print(f"❌ Erreur : La colonne '{target_col}' est introuvable.")
            print(f"Colonnes disponibles : {list(df.columns)}")
            return

        # 3. Conversion en format numérique pour éviter les erreurs de lecture
        df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
        
        # 4. Filtrage pour l'Afrique (Code 903)
        africa_df = df[df[target_col] == 903]
        
        results = {}
        
        # 5. Extraction des données
        for _, row in africa_df.iterrows():
            country_name = str(row['Region, development group, country or area of destination'])
            country_id = str(row['Location code of destination'])
            
            # Récupération de la valeur pour 2024 (gère le format texte ou numérique de l'en-tête)
            stock_value = str(row['2024']) if '2024' in df.columns else str(row[2024])
            
            results[country_id] = {
                "id": country_id,
                "name": {"fr": country_name, "en": country_name},
                "stock": stock_value,
                "history": [{"year": 2024, "value": stock_value}] 
            }
            
        # 6. Génération du fichier JavaScript
        with open('countryData_final.js', 'w', encoding='utf-8') as f:
            f.write("export const countryData = " + json.dumps(results, indent=2, ensure_ascii=False) + ";\n")
            
        print(f"✅ SUCCÈS : Fichier 'countryData_final.js' généré avec {len(results)} entrées !")

    except Exception as e:
        print(f"❌ Une erreur s'est produite : {e}")

if __name__ == "__main__":
    process_data()