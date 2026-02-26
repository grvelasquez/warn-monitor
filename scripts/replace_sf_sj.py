import re

file_path = r'c:\Users\grvel\Dashboard\src\HomePriceIndexDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements
content = content.replace('sfHomePriceData', 'sjHomePriceData')
content = content.replace('setSfHomePriceData', 'setSjHomePriceData')
content = content.replace('sfHpiData', 'sjHpiData')
content = content.replace('sf_home_price_index.json', 'sj_home_price_index.json')
content = content.replace('sfData', 'sjData')
content = content.replace('sf:', 'sj:')
content = content.replace('sf]', 'sj]')
content = content.replace('San Francisco', 'San Jose')
content = content.replace('colorSf', 'colorSj')
content = content.replace('name="sf"', 'name="sj"')
content = content.replace('dataKey="sf"', 'dataKey="sj"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced SF with SJ in HomePriceIndexDashboard.jsx")
