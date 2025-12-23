# Import Test Data

Ce dossier contient des fichiers CSV pour tester tous les cas d'import possibles.

## Liste des fichiers de test

| # | Fichier | Cas testé | Comportement attendu |
|---|---------|-----------|---------------------|
| 01 | `01_happy_path.csv` | Données valides standard | ✅ Import complet, 4 leads créés |
| 02 | `02_empty_file.csv` | Fichier vide | ❌ Erreur: fichier vide |
| 03 | `03_headers_only.csv` | Seulement les en-têtes | ❌ Erreur: aucune donnée |
| 04 | `04_missing_contact_fields.csv` | Champs contact manquants | ⚠️ 3 valides (email/phone/external_id présent), 2 invalides |
| 05 | `05_invalid_emails.csv` | Emails malformés | ⚠️ 9 invalides, 1 valide (téléphone seul) |
| 06 | `06_email_auto_fix.csv` | Emails avec typos domaine | ✅ Emails corrigés automatiquement (gmail.com, yahoo.fr, etc.) |
| 07 | `07_phone_formats.csv` | Formats téléphone variés | ✅ Tous normalisés au format +33, 2 warnings (trop court/long) |
| 08 | `08_duplicates_in_file.csv` | Doublons dans le fichier | ⚠️ Doublons détectés sur email/phone/external_id |
| 09 | `09_special_characters.csv` | Caractères spéciaux | ✅ Accents, apostrophes, guillemets, esperluettes gérés |
| 10 | `10_whitespace_issues.csv` | Espaces et tabulations | ✅ Espaces supprimés automatiquement |
| 11 | `11_mixed_valid_invalid.csv` | Mix valide/invalide | ⚠️ 7 valides, 3 invalides |
| 12 | `12_french_column_names.csv` | En-têtes français | ✅ Auto-mapping colonnes françaises |
| 13 | `13_english_column_names.csv` | En-têtes anglais | ✅ Auto-mapping colonnes anglaises |
| 14 | `14_crm_export_format.csv` | Format export CRM | ✅ Auto-mapping colonnes CRM (Hubspot, Salesforce, etc.) |
| 15 | `15_long_values.csv` | Valeurs très longues | ✅ Import OK, vérifier troncature si limite |
| 16 | `16_status_values.csv` | Statuts variés | ✅ Statuts valides mappés, invalides → "Nouveau" |
| 17 | `17_encoding_utf8.csv` | UTF-8 multi-langues | ✅ Allemand, espagnol, turc, chinois, japonais, russe, grec |
| 18 | `18_empty_values.csv` | Champs vides variés | ⚠️ Certains invalides (aucun contact), certains OK avec warnings |
| 19 | `19_postal_codes.csv` | Codes postaux variés | ✅ Normalisation codes postaux (leading zeros, espaces) |
| 20 | `20_all_fields_complete.csv` | Tous champs remplis | ✅ Import complet avec assigned_to |
| 21 | `21_single_row.csv` | Une seule ligne | ✅ Import 1 lead |
| 22 | `22_large_batch_100.csv` | 100 leads | ✅ Test performance batch |
| 23 | `23_facebook_lead_ads.csv` | Format Facebook Lead Ads | ✅ Auto-mapping colonnes Facebook |
| 24 | `24_unknown_columns.csv` | Colonnes inconnues | ✅ Colonnes inconnues ignorées |
| 25 | `25_semicolon_delimiter.csv` | Délimiteur point-virgule | ✅ Détection automatique délimiteur |
| 26 | `26_tab_delimiter.csv` | Délimiteur tabulation | ✅ Détection automatique délimiteur TSV |
| 27 | `27_windows_line_endings.csv` | Line endings Windows CRLF | ✅ Gestion CRLF/LF automatique |

## Légende

- ✅ Succès attendu
- ⚠️ Succès partiel avec warnings ou lignes ignorées
- ❌ Erreur attendue

## Cas d'utilisation

### Test basique
Utiliser `01_happy_path.csv` pour vérifier que l'import fonctionne.

### Test validation
Utiliser `04_missing_contact_fields.csv`, `05_invalid_emails.csv`, `11_mixed_valid_invalid.csv` pour tester les validations.

### Test normalisation
Utiliser `06_email_auto_fix.csv`, `07_phone_formats.csv`, `10_whitespace_issues.csv`, `19_postal_codes.csv` pour tester les normalisations automatiques.

### Test auto-mapping
Utiliser `12_french_column_names.csv`, `13_english_column_names.csv`, `14_crm_export_format.csv`, `23_facebook_lead_ads.csv` pour tester le mapping intelligent des colonnes.

### Test encodage
Utiliser `09_special_characters.csv`, `17_encoding_utf8.csv` pour tester l'encodage UTF-8.

### Test performance
Utiliser `22_large_batch_100.csv` pour tester les imports en batch.

### Test erreurs
Utiliser `02_empty_file.csv`, `03_headers_only.csv` pour tester la gestion des erreurs.
