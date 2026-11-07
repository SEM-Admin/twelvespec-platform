-- Discovered by the persisted lead/pipeline integration journey.
alter table app.opportunities add column contact_id uuid,
 add foreign key(tenant_id,workspace_id,contact_id) references app.contacts(tenant_id,workspace_id,id);
create index opportunities_contact_id on app.opportunities(tenant_id,workspace_id,contact_id);
