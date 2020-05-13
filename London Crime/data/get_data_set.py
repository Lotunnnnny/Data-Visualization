from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import csv
import time
import re


def get_all_neighbourhoods():
    driver.get("https://data.police.uk/api/metropolitan/neighbourhoods")
    return json.loads(driver.find_element_by_tag_name('pre').text)


def create_dict(zones):
    final_dict = {}
    for i in range(len(zones)):
        id = zones[i].get('id')
        final_dict[id] = zones[i]
        final_dict[id]['crime'] = {}
    return final_dict


def locate_crime_neighbourhood_id(latitude, longitude):
    driver.get("https://data.police.uk/api/locate-neighbourhood?q=" + latitude + "," + longitude + "")
    try:
        neighbourhood = json.loads(driver.find_element_by_tag_name('pre').text)
        return neighbourhood.get('neighbourhood')
    except:
        return 'Not Found'


def fill_dict(final_dict, data_file, start_row, row_num):
    file = data_file
    count = -1
    with open(file) as fh:
        rd = csv.DictReader(fh, delimiter=',')
        for row in rd:
            count += 1
            if count < start_row:
                continue
            if count >= start_row+row_num:
                break
            latitude = row.get('Latitude')
            longitude = row.get('Longitude')
            month = row.get('Month')
            crime_type = row.get('Crime type')
            id = locate_crime_neighbourhood_id(latitude, longitude)
            item = final_dict.get(id)
            if item is not None:
                print('Line ' + str(count) + ': ' + str(id))
                if item.get('crime').get(month) is None:
                    item.get('crime')[month] = {
                        'Anti-social behaviour': 0,
                        'Bicycle theft': 0,
                        'Burglary': 0,
                        'Criminal damage and arson': 0,
                        'Drugs': 0,
                        'Other theft': 0,
                        'Possession of weapons': 0,
                        'Public order': 0,
                        'Robbery': 0,
                        'Shoplifting': 0,
                        'Theft from the person': 0,
                        'Vehicle crime': 0,
                        'Violence and sexual offences': 0,
                        'Other crime': 0,
                        'All crime': 0
                    }
                if item.get('crime')[month][crime_type] is not None:
                    item.get('crime')[month][crime_type] += 1
                else:
                    item.get('crime')[month]['Other crime'] += 1
                item.get('crime')[month]['All crime'] += 1
                file_path = "./data_set_in_neighbourhoods.json"
                file = open(file_path, "w", encoding='utf-8')
                file.write(json.dumps(final_dict))
                file.close()
    fh.close()
    return final_dict


def load_dict_from_json(file_path):
    with open(file_path) as f:
        content = json.load(f)
        return content


def parse_name_2_url(name):
    temp = name.lower().replace(' ', '-').replace('\'', '').replace(',', '')
    if temp == 'purley-oaks-and-riddlesdown':
        temp = 'purley-oaks'
    elif temp == 'victoria-business-hub':
        temp = 'victoria-business'
    return temp


def locate_neighbourhood_in_borough(neibourhood_id, neibourhood_name):
    driver.get('https://data.police.uk/api/metropolitan/' + neibourhood_id)
    try:
        neighbourhood = json.loads(driver.find_element_by_tag_name('pre').text)
        url_containing_borough = neighbourhood.get('url_force')
        neibourhood_name = parse_name_2_url(neibourhood_name)
        if neibourhood_name == 'hyde-park-&amp;amp;-kensington-gardens':
            return 'royal-parks'
        x = re.search("met\/", url_containing_borough)
        y = re.search("\/"+neibourhood_name+"\/", url_containing_borough)
        return url_containing_borough[x.span()[1]:y.span()[0]]
    except:
        return 'Not Found'


def find_id_by_name(dict, name):
    for key in dict:
        if dict.get(key).get('name').lower() == name.lower():
            return key
    return 'Not Found'


def init_borough_data_dict():
    file_path = "./London_Boroughs.json"
    borough_data_dict = create_dict(load_dict_from_json(file_path).get('objects').get('London_Borough_Excluding_MHW'))
    for key in borough_data_dict:
        borough_data_dict.get(key)['crime'] = {
            'Anti-social behaviour': 0,
            'Bicycle theft': 0,
            'Burglary': 0,
            'Criminal damage and arson': 0,
            'Drugs': 0,
            'Other theft': 0,
            'Possession of weapons': 0,
            'Public order': 0,
            'Robbery': 0,
            'Shoplifting': 0,
            'Theft from the person': 0,
            'Vehicle crime': 0,
            'Violence and sexual offences': 0,
            'Other crime': 0,
            'All crime': 0
        }
    return borough_data_dict


def from_url_2_name(url):
    url_name_dict = {
        "westminster": "City of Westminster",
        "kensington-and-chelsea": "Kensington and Chelsea",
        "hammersmith-and-fulham": "Hammersmith and Fulham",
        "richmond-upon-thames": "Richmond upon Thames",
        "kingston-upon-thames": "Kingston upon Thames",
        "kingston": "Kingston upon Thames",
        "barking-and-dagenham": "Barking and Dagenham",
        "waltham-forest": "Waltham Forest",
        "tower-hamlets": "Tower Hamlets",
        "safer-airport": "Hillingdon",
    }
    return url_name_dict.get(url, url)


def sum_neighbourhood_2_boroughs(neighbour_file):
    borough_data_dict = init_borough_data_dict()
    neighbour_data_dict = load_dict_from_json(neighbour_file)

    file_path = "./data_set_in_boroughs.json"
    file = open(file_path, "w", encoding='utf-8')

    _count = 0
    for key in neighbour_data_dict:
        print('count: ' + str(_count))
        _count += 1
        neighbour = neighbour_data_dict.get(key)
        borough_name = locate_neighbourhood_in_borough(neighbour.get('id'), neighbour.get('name'))
        borough_name = from_url_2_name(borough_name)
        try:
            crime_neighbour = neighbour.get('crime').get('2020-02')
            borough_id = find_id_by_name(borough_data_dict, borough_name)
            crime_borough = borough_data_dict.get(borough_id).get('crime')
            for sub_key in crime_neighbour:
                crime_borough[sub_key] += crime_neighbour.get(sub_key)
        except:
            continue

    file.write(json.dumps(borough_data_dict))
    file.close()


def sort_data(path):
    with open(path) as f:
        crime_types = ['Anti-social behaviour',
                        'Bicycle theft',
                        'Burglary',
                        'Criminal damage and arson',
                        'Drugs',
                        'Other theft',
                        'Possession of weapons',
                        'Public order',
                        'Robbery',
                        'Shoplifting',
                        'Theft from the person',
                        'Vehicle crime',
                        'Violence and sexual offences',
                        'Other crime',
                        'All crime']
        dict = load_dict_from_json(path)
        # sorted = {}
        sorted = []
        for borough_id in range(33):
            temp = []
            borough = dict.get(str(borough_id+1))
            # borough_name = borough.get('name')
            borough_crime = borough.get('crime')
            # sorted[borough_name] = {
            #     'id': borough_id+1
            # }
            for _ in range(len(crime_types)):
                crime_type = crime_types[_]
                temp.append(borough_crime.get(crime_type))
                # sorted[borough_name][crime_type] = borough_crime.get(crime_type)
            sorted.append(temp)
    sorted = list(map(list, zip(*sorted)))
    print(sorted)
    for i in range(len(crime_types)):
        file_path = crime_types[i]+'.csv'
        f = open(file_path, "w", encoding='utf-8')
        f.write('id,zone_name,num\n')
        for j in range(33):
            borough_id = str(j+1)
            borough = dict.get(borough_id)
            borough_name = borough.get('name')
            f.write(borough_id+','+borough_name+','+str(sorted[i][j])+'\n')

    return sorted



chrome_options = Options()
driver = webdriver.Chrome(executable_path='../lib/chromedriver',
                          chrome_options=chrome_options)

# neighbourhoods = get_all_neighbourhoods()  # neighbourhoods in metropolitan
# final_dict = create_dict(neighbourhoods)

# final_dict = fill_dict(final_dict, 'metro_data/2020-02/2020-02-metropolitan-street.csv', 0, 1000)
# test_dict = load_dict_from_json('data_set_in_neighbourhoods.json')
# final_dict = fill_dict(test_dict, 'metro_data/2020-02/2020-02-metropolitan-street.csv', 22000, 80000)
# sum_neighbourhood_2_boroughs('./data_set_in_neighbourhoods.json')
# sort_data('./data_set_in_boroughs.json')
