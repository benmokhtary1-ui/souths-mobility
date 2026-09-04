import pandas as pd
import json

def process_labour_data():
    print("🚀 Lecture du fichier OIT (Marché du travail)...")
    file_path = 'donnees-sources/oit-population-active-par-statut-migratoire.xlsx'
    
    # Dictionnaire de traduction : Nom OIT -> Code ISO ONU (pour l'Afrique)
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
    
    try:
        # On lit la feuille 4, on saute 4 lignes, sans chercher de titre de colonne (header=None)
        df = pd.read_excel(file_path, sheet_name='4. Participation rate by sex', skiprows=4, header=None)
        
        results = {}
        
        # Les colonnes de l'OIT: 2 = Pays, 4 = Sexe, 5 = Statut migratoire, 6 = Valeur
        for _, row in df.iterrows():
            country_name = str(row[2]).strip()
            sex = str(row[4]).strip()
            status = str(row[5]).strip()
            value = str(row[6]).strip()
            
            # On ne prend que le total global pour les Migrants
            if country_name in ilo_to_un_codes and sex == 'Total' and status == 'Migrants':
                un_code = ilo_to_un_codes[country_name]
                results[un_code] = {
                    "labour_participation": value
                }
                
        print(f"✅ SUCCÈS : Données d'emploi extraites pour {len(results)} pays africains !")
        print("\nVoici un extrait de ce qu'on a trouvé (Taux d'activité des migrants en %) :")
        for code, data in list(results.items())[:5]:
            print(f"- Pays (Code {code}) : {data['labour_participation']} % de participation active")

    except Exception as e:
        print(f"❌ Erreur : {e}")

if __name__ == "__main__":
    process_labour_data()