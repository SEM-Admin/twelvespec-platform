#!/usr/bin/env python3
"""Validate public research provenance and links to the existing implementation plan.

This checks research artifacts, not supplier access or implementation acceptance.
It deliberately does not load the owner's private intelligence package.
"""
import csv
import json
import re
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/industry-research'
checks = 0


def check(condition, message):
    global checks
    if not condition:
        raise AssertionError(message)
    checks += 1


def read(path):
    return json.loads((ROOT / path).read_text())


def unique(rows, count, label):
    values = {row['id'] for row in rows}
    check(len(rows) == count and len(values) == count, f'{label}: count or duplicate ID')
    return values


data = read('docs/industry-research/industry-intelligence.json')
features = read('docs/business-research/research.json')
plan = read('docs/planning/gap-backlog.json')
registry = read('specification/master-v1/contracts/module_registry.json')
source_ids = unique(data['sources'], 36, 'industry sources')
domain_ids = unique(data['domains'], 16, 'industry domains')
decision_ids = unique(data['decisions'], 16, 'application decisions')
feature_ids = {row['id'] for row in features['features']}
gap_ids = {row['id'] for row in plan['workItems']}
module_ids = {row['code'] for row in registry}
active_ids = {row['code'] for row in registry if row['status'] != 'COMING_SOON'}
check(len(active_ids) == 19 and len(module_ids) == 20, 'controlling module scope changed')
check(data['timezone'] == 'America/Chicago', 'research date needs owner timezone')
check(data['researchDate'] == '2026-11-06', 'dated research snapshot changed without review')
check(len(data['limitations']) >= 4, 'research and access limits must remain visible')

access_states = {
    'PUBLIC_PAGE_REVIEWED', 'FETCH_BLOCKED_403', 'LOGIN_REQUIRED_NOT_READ',
    'OFFICIAL_INDEXED_EXCERPT_DIRECT_FETCH_403', 'TOOL_CONTENT_LIMIT_NOT_READ',
    'URL_UNAVAILABLE',
}
for source in data['sources']:
    url = urlparse(source['url'])
    check(url.scheme == 'https' and bool(url.hostname), source['id'] + ': invalid source URL')
    query_keys = {key.lower() for key, _ in parse_qsl(url.query)}
    check(not url.username and not url.password and not query_keys.intersection({
        'token', 'access_token', 'api_key', 'apikey', 'password', 'signature', 'authorization',
    }), source['id'] + ': source contains authentication material')
    check('psrestful' not in url.hostname.lower(), 'prohibited integration source')
    check(source['access'] in access_states, source['id'] + ': unclassified source access')
    check(bool(source['publicObservation']) and bool(source['twelveSpecApplication']),
          source['id'] + ': public observation and original application must be separate')
    check(source['integrationVerification'] == 'NOT_TESTED' and source['conformanceClaim'] == 'NONE',
          source['id'] + ': documentation is not authenticated or conformance verification')
    check(source['reviewedOn'] == data['researchDate'] and source['timezone'] == data['timezone'],
          source['id'] + ': date provenance differs from snapshot')

covered = set()
for domain in data['domains']:
    check(bool(domain['sources']) and set(domain['sources']) <= source_ids,
          domain['id'] + ': missing or unknown source')
    check(bool(domain['modules']) and set(domain['modules']) <= active_ids,
          domain['id'] + ': unknown or deferred module')
    covered.update(domain['modules'])
    check(bool(domain['requiredInputs']) and bool(domain['exceptionConditions']) and bool(domain['twelveSpecWorkflow']),
          domain['id'] + ': missing data, workflow or exceptions')
    check(bool(domain['features']) and set(domain['features']) <= feature_ids,
          domain['id'] + ': unknown feature design')
    check(bool(domain['gaps']) and set(domain['gaps']) <= gap_ids,
          domain['id'] + ': unknown work package')
    check(domain['status'] == 'RESEARCHED_SCOPE_NOT_SUPPLIER_VERIFIED',
          domain['id'] + ': research must not activate a route')
check(covered == active_ids, 'industry domains must map all 19 active modules')
for decision in data['decisions']:
    check(bool(decision['features']) and set(decision['features']) <= feature_ids,
          decision['id'] + ': unknown feature design')
    check(bool(decision['gaps']) and set(decision['gaps']) <= gap_ids,
          decision['id'] + ': unknown work package')
    check(bool(decision['implementation']) and bool(decision['decision']),
          decision['id'] + ': application and disposition are required')
check(next(row for row in data['decisions'] if row['id'] == 'IND-15')['decision'] == 'DEFER',
      'advanced capabilities must remain deferred')

for filename, ids, column in [
    ('industry-domains.csv', domain_ids, 'domain_id'),
    ('industry-decisions.csv', decision_ids, 'decision_id'),
]:
    with (OUT / filename).open(newline='') as stream:
        rows = list(csv.DictReader(stream))
    check({row[column] for row in rows} == ids and len(rows) == len(ids), filename + ': CSV coverage differs')

for path in OUT.iterdir():
    if path.suffix not in {'.md', '.json', '.csv'}:
        continue
    text = path.read_text()
    check('\r' not in text, path.name + ': use consistent newlines')
    check(not re.search(r'drive\.google\.com|mail\.google\.com|sediment://|postgres(?:ql)?://', text, re.I),
          path.name + ': private attachment/access/connection reference in public research')
    if path.suffix == '.md':
        for destination in re.findall(r'\[[^\]]*\]\(([^)]+)\)', text):
            if destination.startswith(('https://', '#')):
                continue
            target = (path.parent / unquote(destination.split('#')[0])).resolve()
            check(target.is_relative_to(ROOT) and target.exists(), path.name + ': broken local link ' + destination)

print(f'Industry research integrity: {checks} checks passed; 36 sources, 16 domains, 16 decisions, all 19 active modules linked.')
print('These checks validate provenance and plan coverage; supplier access, implementation and manufacturing acceptance remain separate.')
