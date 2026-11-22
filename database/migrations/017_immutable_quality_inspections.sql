-- Corrections/reinspection create a new record. Legacy inspection history is
-- preserved, but does not acquire explicit-check evidence retroactively.
create trigger qc_check_immutable before update or delete on app.qc_checks
 for each row execute function app.reject_mutation();
