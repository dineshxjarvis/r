Let me verify the few I haven't already pulled up in this conversation.All of these surfaced in searches during this conversation, so the paths are as-returned rather than reconstructed. I've flagged the handful I'm going from memory on.

## Indian — mine-level

**Star Rating of Coal Mines**
- Portal: `https://starrating.coal.gov.in/`
- FAQ (explains the 7 modules): `https://starrating.coal.gov.in/faq.php`
- Results 2019-20: `https://starrating.coal.gov.in/policy/result-star-rating2019-20.pdf`
- Results 2022-23: `https://starrating.coal.gov.in/policy/result-star-rating2022-23.pdf`
- Results 2023-24: `https://starrating.coal.gov.in/policy/result-star-rating2023-24.pdf`
- CCO mirror: `https://coalcontroller.gov.in/files/guidelines-acts-documents/result_star_rating2022_23.pdf`
- CCO results index: `https://coalcontroller.gov.in/results`
- Non-coal equivalent (IBM), shows mine ID format: `https://ibm.gov.in/writereaddata/files/1720508298668cdf8acb304Star_Rating_2223Complete_Notification.pdf`

**PARIVESH / EC letters**
- Sequential EC letter endpoint: `https://environmentclearance.nic.in/Auth/openletter.aspx?EC=3638` — increment the integer
- EC letter PDF pattern: `https://environmentclearance.nic.in/writereaddata/Form-1A/EC/` + filename
- EAC minutes pattern: `https://environmentclearance.nic.in/writereaddata/Form-1A/Minutes/` + filename
- Example coal EAC minutes: `.../Minutes/2306202165221975FinalMoMof14thEAC.pdf`
- Example EC letter PDF: `.../EC/_ECL_7Q3836-EC_LETTER_FINAL.pdf`
- CCR module OM (explains six-monthly reporting): `https://parivesh.nic.in/publicdocument/UPLOAD_OM_NOTIFICATION/IA_DOCS/1002_25012026043343.pdf`

## Indian — statute and circulars

- DGMS home: `https://www.dgms.gov.in/`
- DGMS Forms: `https://www.dgms.gov.in/UserView/index?mid=1258`
- DGMS Circulars: `https://www.dgms.gov.in/UserView/index?mid=1648`
- DGMS Bulletins: `https://www.dgms.gov.in/UserView/index?mid=1649`
- Gazette notifications: `https://www.dgms.gov.in/UserView/index?mid=1655`
- DG Annual Reports: `https://www.dgms.gov.in/UserView/index?mid=1491`
- Accident statistics portal (login-gated): `https://accident-statistics.dgms.gov.in/`
- **CMR 2017 full text**: `https://www.dgms.net/Coal%20Mines%20Regulation%202017.pdf`
- DGMS at a Glance 2023: `https://www.dgms.net/DGMS%20AT%20A%20GLANCE%202023.pdf`
- Mining Plan Guidelines 2025: `https://coal.nic.in/sites/default/files/2025-01/31-01-2025a-wn.pdf`
- India Code (all Acts + subordinate rules): `https://www.indiacode.nic.in/`

## Indian — aggregate

- MoC Annual Report Ch.14, safety (2025-26): `https://coal.nic.in/sites/default/files/2026-02/chap14AnnualReport2026en.pdf`
- Ch.14 (2023-24): `https://coal.gov.in/sites/default/files/2024-07/chap14AnnualReport2024en2.pdf`
- Ch.20, IT (2025-26): `https://coal.nic.in/sites/default/files/2026-02/chap20AnnualReport2026en.pdf`
- Ch.3, policy/technology (2024-25): `https://coal.gov.in/sites/default/files/2025-02/chap3AnnualReport2025en2.pdf`
- data.gov.in — state-wise coal mine accidents: `https://www.data.gov.in/resource/state-wise-number-accidents-coal-mines-reported-mine-management-directorate-general-mines`
- data.gov.in — Parivesh 2.0 EC granted: `https://www.data.gov.in/catalog/environmental-clearance-granted-parivesh-20`

## Indian — incumbent systems (for your "what exists" slide)

- ICIS contractor compliance: `https://coalindiaicis.com/`
- CMSMS on NCoG: `https://ncog.gov.in/CMSS/login`
- Single Window Clearance System: `https://coal.gov.in/nominated-authority/single-window-system`
- CIL Systems Dept (lists their portals): `https://www.coalindia.in/departments/systems/`
- IBM All India Directory of Mining Leases: `https://ibm.gov.in/index.php?c=pages&id=355&m=index`

## Air quality (live Indian data for the demo)

- CPCB Central Control Room: `https://airquality.cpcb.gov.in/ccr/` and `https://app.cpcbccr.com/ccr/#/`
- CPCB National AQI: `https://airquality.cpcb.gov.in/AQI_India/`
- **data.gov.in real-time AQI catalog** (this is the API-accessible one): `https://www.data.gov.in/catalog/real-time-air-quality-index`
- OpenAQ: `https://openaq.org/` — aggregates CPCB with global harmonisation, S3 archive needs no AWS account

Register on data.gov.in for an API key; that's the cleanest route to live station data.

## US — MSHA

- Bulk data index: `https://arlweb.msha.gov/opengovernmentdata/ogimsha.asp`
- Individual zips: `https://arlweb.msha.gov/opengovernmentdata/DataSets/<Name>.zip` (the script has all 20)
- Fatality reports: `https://www.msha.gov/fatality-reports`
- Coal fatal alerts + investigation reports (narrative text): `https://arlweb.msha.gov/fatals/fabc.htm`
- Per-year indices: `https://arlweb.msha.gov/fatals/indices/fabc2011.asp` — swap the year
- Academy fatality archive, ~24,000 reports back to 1840: `https://www.msha.gov/training/training-programs-and-courses/academy-home-page/academy-library/fatality-report`
- Data & reports hub: `https://www.msha.gov/data-and-reports`

## Australia — the near-miss data India doesn't publish

- QLD high-potential incidents dataset: `https://www.data.qld.gov.au/dataset/high-potential-incidents`
- QLD quarterly safety statistics: `https://www.data.qld.gov.au/dataset/quarterly-mines-and-quarries-safety-statistics-data`
- QLD safety performance hub (incl. individual mine site performance 2018-19 to 2024-25): `https://www.business.qld.gov.au/industries/mining-energy-water/resources/safety-health/mining/accidents-incidents-reports/safety-performance`
- RSHQ high-risk incident narratives: `https://www.rshq.qld.gov.au/safety-notices/mines/information-from-high-safety-risks`
- Mirror on national portal: `https://data.gov.au/data/dataset/quarterly-mines-and-quarries-safety-statistics-data`
- NSW Resources Regulator safety: `https://www.resourcesregulator.nsw.gov.au/safety`
- NSW quarterly safety report example: `https://www.resources.nsw.gov.au/sites/default/files/2026-05/quarterly_safety_report_Jan-Mar2026.pdf`

Licence note: the Queensland datasets are CC BY 4.0, so you can use and redistribute with attribution. Check the NSW ones before redistributing.

## Geospatial

- Bhoonidhi (ISRO EO hub, has an API): `https://bhoonidhi.nrsc.gov.in/bhoonidhi/index.html`
- Bhuvan free data download: `https://bhuvan-app3.nrsc.gov.in/data/download/`
- Bhuvan free satellite data wiki: `https://bhuvan.nrsc.gov.in/wiki/index.php/Free_Satellite_Data_Download`
- CartoDEM readme/accuracy: `https://bhuvan-app3.nrsc.gov.in/data/download/tools/document/CartoDEMReadme_v1_u1_23082011.pdf`
- CartoDEM on data.gov.in: `https://www.data.gov.in/catalog/digital-elevation-model-dem-generated-cartosat-1-satellite-data-india`
- India open geodata compilation (55+ layers, GeoJSON/Parquet/PMTiles): `https://yashveeeeeeer.github.io/india-geodata/`

## NLP / schema

- CUAD: `https://www.atticusprojectai.org/cuad/`
- CUAD code + trained model: `https://github.com/TheAtticusProject/cuad`
- CUAD paper: `https://arxiv.org/abs/2103.06268`
- OASIS LegalDocML / Akoma Ntoso TC: `https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=legaldocml`
- LegalRuleML reporting-obligations specialisation (readable worked example): `https://interoperable-europe.ec.europa.eu/sites/default/files/news/2024-07/A%20LegalRuleML%20specialisation.pdf`
- LegalRuleML design paper: `http://www.governatori.net/papers/2013/icail2013legalruleml.pdf`

**Unverified, from memory — check before relying on them:** InLegalBERT and InCaseLawBERT on HuggingFace (IIT-KGP Law-AI group), Surya OCR, Geofabrik OSM extracts, ContractNLI, and the SEBI BRSR filings for CIL and subsidiaries (those are on the exchanges' sites and in the annual reports, but I didn't confirm a direct path).

Two practical notes: `coal.gov.in` and `coal.nic.in` serve the same content, so if one path 404s try the other. And the DGMS and PARIVESH sites are slow and occasionally down — cache aggressively on first fetch rather than re-requesting during development.
