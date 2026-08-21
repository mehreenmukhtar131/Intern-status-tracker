// Vanilla JavaScript client for the supplied FastAPI API.
const API = 'http://127.0.0.1:8000';
const $ = id => document.getElementById(id);
const today = new Date().toISOString().slice(0, 10);
let candidates = [], statuses = [];

function escapeHtml(value) { const box = document.createElement('div'); box.textContent = value ?? ''; return box.innerHTML; }
function alert(message, type = 'success') { const node = document.createElement('div'); node.className = `alert ${type}`; node.textContent = message; $('alerts').append(node); setTimeout(() => node.remove(), 4500); }
function errorMessage(data) { return Array.isArray(data?.detail) ? data.detail.map(e => `${e.loc.at(-1)}: ${e.msg}`).join(' | ') : data?.detail || 'The request could not be completed.'; }
async function request(path, options = {}) {
  const response = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(data));
  return data;
}
function nameFor(id) { return candidates.find(c => c.id === +id)?.full_name || `Candidate #${id}`; }
function fillSelects() {
  const options = candidates.map(c => `<option value="${c.id}">${escapeHtml(c.full_name)} (#${c.id})</option>`).join('');
  $('statusCandidate').innerHTML = '<option value="">Select a candidate</option>' + options;
  $('filterCandidate').innerHTML = '<option value="">All candidates</option>' + options;
}
async function loadCandidates() {
  const body = $('candidateRows'); body.innerHTML = '<tr><td colspan="6" class="empty-cell">Loading candidates…</td></tr>';
  try {
    candidates = await request('/api/candidates'); fillSelects(); $('candidateCount').textContent = `(${candidates.length} total)`;
    body.innerHTML = candidates.length ? candidates.map(c => `<tr><td>${c.id}</td><td><b>${escapeHtml(c.full_name)}</b></td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.training_track)}</td><td>${c.is_active ? 'Active' : 'Inactive'}</td><td class="actions"><button class="secondary" data-edit-candidate="${c.id}">Edit</button><button class="danger" data-delete-candidate="${c.id}">Delete</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty-cell">No candidates have been added yet.</td></tr>';
  } catch (e) { body.innerHTML = `<tr><td colspan="6" class="empty-cell">${escapeHtml(e.message)}</td></tr>`; alert(e.message, 'error'); }
}
async function loadStatuses() {
  const body = $('statusRows'); body.innerHTML = '<tr><td colspan="8" class="empty-cell">Loading statuses…</td></tr>';
  const query = new URLSearchParams(); if ($('filterCandidate').value) query.set('candidate_id', $('filterCandidate').value); if ($('filterDate').value) query.set('status_date', $('filterDate').value);
  try {
    statuses = await request(`/api/statuses${query.size ? '?' + query : ''}`);
    body.innerHTML = statuses.length ? statuses.map(s => `<tr><td>${s.status_date}</td><td><b>${escapeHtml(nameFor(s.candidate_id))}</b><br><small>#${s.candidate_id}</small></td><td class="truncate" title="${escapeHtml(s.work_completed)}">${escapeHtml(s.work_completed)}</td><td class="truncate" title="${escapeHtml(s.topics_learned)}">${escapeHtml(s.topics_learned)}</td><td class="truncate" title="${escapeHtml(s.blockers)}">${escapeHtml(s.blockers)}</td><td class="truncate" title="${escapeHtml(s.next_day_plan)}">${escapeHtml(s.next_day_plan)}</td><td class="completion">${s.completion_percentage}%</td><td class="actions"><button class="secondary" data-edit-status="${s.id}">Edit</button><button class="danger" data-delete-status="${s.id}">Delete</button></td></tr>`).join('') : '<tr><td colspan="8" class="empty-cell">No daily statuses match these filters.</td></tr>';
  } catch (e) { body.innerHTML = `<tr><td colspan="8" class="empty-cell">${escapeHtml(e.message)}</td></tr>`; alert(e.message, 'error'); }
}
async function loadDashboard() {
  const date = $('dashboardDate').value; if (!date) return alert('Please select a report date.', 'error');
  try {
    const data = await request(`/api/dashboard/summary?date=${date}`);
    $('activeCount').textContent = data.total_active_candidates; $('submittedCount').textContent = data.submitted_count; $('missingCount').textContent = data.missing_count; $('averageCompletion').textContent = `${data.average_completion_percentage}%`;
    $('submittedList').innerHTML = data.submitted_candidates.length ? data.submitted_candidates.map(c => `<div class="list-row"><span><b>${escapeHtml(c.full_name)}</b><br><small>Candidate #${c.candidate_id}</small></span><span class="completion">${c.completion_percentage}%</span></div>`).join('') : '<div class="empty">No candidates submitted a report for this date.</div>';
    $('missingList').innerHTML = data.missing_candidates.length ? data.missing_candidates.map(c => `<div class="list-row"><span><b>${escapeHtml(c.full_name)}</b><br><small>Candidate #${c.candidate_id}</small></span><span class="missing">Missing</span></div>`).join('') : '<div class="empty">Everyone has submitted a report. Great work!</div>';
  } catch (e) { alert(e.message, 'error'); }
}
function resetCandidate() { $('candidateForm').reset(); $('candidateEditId').value = ''; $('candidateActive').checked = true; $('candidateTitle').textContent = 'Add candidate'; $('candidateSubmit').textContent = 'Create candidate'; $('cancelCandidate').classList.add('hidden'); }
function resetStatus() { $('statusForm').reset(); $('statusEditId').value = ''; $('statusDate').value = today; $('statusTitle').textContent = 'Add daily status'; $('statusSubmit').textContent = 'Save status'; $('cancelStatus').classList.add('hidden'); }
async function remove(path, label) { if (!confirm('Are you sure you want to delete this item?')) return; try { await request(path, { method: 'DELETE' }); alert(`${label} deleted successfully.`); await loadCandidates(); await loadStatuses(); await loadDashboard(); } catch (e) { alert(e.message, 'error'); } }

document.addEventListener('DOMContentLoaded', async () => {
  $('todayLabel').textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date()); $('dashboardDate').value = today; $('statusDate').value = today;
  await loadCandidates(); await Promise.all([loadStatuses(), loadDashboard()]);
  $('dashboardForm').onsubmit = e => { e.preventDefault(); loadDashboard(); }; $('refreshCandidates').onclick = loadCandidates;
  $('candidateForm').onsubmit = async e => { e.preventDefault(); const id = $('candidateEditId').value; const payload = { full_name: $('candidateName').value.trim(), email: $('candidateEmail').value.trim(), training_track: $('candidateTrack').value.trim(), is_active: $('candidateActive').checked }; try { await request(`/api/candidates${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); alert(id ? 'Candidate updated successfully.' : 'Candidate created successfully.'); resetCandidate(); await loadCandidates(); await loadDashboard(); } catch (err) { alert(err.message, 'error'); } };
  $('statusForm').onsubmit = async e => { e.preventDefault(); const id = $('statusEditId').value; const payload = { candidate_id: +$('statusCandidate').value, status_date: $('statusDate').value, work_completed: $('workCompleted').value.trim(), topics_learned: $('topicsLearned').value.trim(), blockers: $('blockers').value.trim(), next_day_plan: $('nextPlan').value.trim(), completion_percentage: +$('completion').value }; try { await request(`/api/statuses${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); alert(id ? 'Daily status updated successfully.' : 'Daily status created successfully.'); resetStatus(); await loadStatuses(); await loadDashboard(); } catch (err) { alert(err.message, 'error'); } };
  $('filters').onsubmit = e => { e.preventDefault(); loadStatuses(); }; $('clearFilters').onclick = () => { $('filters').reset(); loadStatuses(); }; $('cancelCandidate').onclick = resetCandidate; $('cancelStatus').onclick = resetStatus;
  document.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.deleteCandidate) return remove(`/api/candidates/${b.dataset.deleteCandidate}`, 'Candidate'); if (b.dataset.deleteStatus) return remove(`/api/statuses/${b.dataset.deleteStatus}`, 'Daily status'); if (b.dataset.editCandidate) { const c = candidates.find(x => x.id === +b.dataset.editCandidate); $('candidateEditId').value = c.id; $('candidateName').value = c.full_name; $('candidateEmail').value = c.email; $('candidateTrack').value = c.training_track; $('candidateActive').checked = c.is_active; $('candidateTitle').textContent = `Edit candidate #${c.id}`; $('candidateSubmit').textContent = 'Update candidate'; $('cancelCandidate').classList.remove('hidden'); $('candidates').scrollIntoView(); } if (b.dataset.editStatus) { const s = statuses.find(x => x.id === +b.dataset.editStatus); $('statusEditId').value = s.id; $('statusCandidate').value = s.candidate_id; $('statusDate').value = s.status_date; $('workCompleted').value = s.work_completed; $('topicsLearned').value = s.topics_learned; $('blockers').value = s.blockers; $('nextPlan').value = s.next_day_plan; $('completion').value = s.completion_percentage; $('statusTitle').textContent = `Edit daily status #${s.id}`; $('statusSubmit').textContent = 'Update status'; $('cancelStatus').classList.remove('hidden'); $('statuses').scrollIntoView(); } };
});
