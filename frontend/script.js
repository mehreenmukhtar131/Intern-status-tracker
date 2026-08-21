// Vanilla JavaScript client for the FastAPI API.

const API = 'http://127.0.0.1:8000';

const $ = id => document.getElementById(id);

const today = new Date().toISOString().slice(0, 10);

let candidates = [];
let statuses = [];


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function escapeHtml(value) {
    const box = document.createElement('div');
    box.textContent = value ?? '';
    return box.innerHTML;
}


function alert(message, type = 'success') {

    const node = document.createElement('div');

    node.className = `alert ${type}`;

    node.textContent = message;

    $('alerts').append(node);

    setTimeout(() => node.remove(), 4500);
}


function errorMessage(data) {

    if (Array.isArray(data?.detail)) {

        return data.detail
            .map(error => {
                const field = error.loc?.at(-1) || 'field';
                return `${field}: ${error.msg}`;
            })
            .join(' | ');
    }

    return data?.detail ||
        'The request could not be completed.';
}


async function request(path, options = {}) {

    const response = await fetch(API + path, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(errorMessage(data));
    }

    return data;
}


function nameFor(id) {

    return candidates.find(
        candidate => candidate.id === +id
    )?.full_name || 'Unknown candidate';
}


/* =========================================================
   SELECT BOXES
   ========================================================= */

function fillSelects() {

    const options = candidates
        .map(candidate => `
            <option value="${candidate.id}">
                ${escapeHtml(candidate.full_name)}
            </option>
        `)
        .join('');

    $('statusCandidate').innerHTML =
        '<option value="">Select a candidate</option>' +
        options;

    $('filterCandidate').innerHTML =
        '<option value="">All candidates</option>' +
        options;
}


/* =========================================================
   CANDIDATES
   ========================================================= */

async function loadCandidates() {

    const body = $('candidateRows');

    body.innerHTML = `
        <tr>
            <td colspan="6" class="empty-cell">
                Loading candidates…
            </td>
        </tr>
    `;

    try {

        candidates = await request('/api/candidates');

        fillSelects();

        $('candidateCount').textContent =
            `(${candidates.length} total)`;


        body.innerHTML = candidates.length

            ? candidates.map(candidate => `
                <tr>

                    <td>${candidate.id}</td>

                    <td>
                        <b>
                            ${escapeHtml(candidate.full_name)}
                        </b>
                    </td>

                    <td>
                        ${escapeHtml(candidate.email)}
                    </td>

                    <td>
                        ${escapeHtml(candidate.training_track)}
                    </td>

                    <td>
                        ${candidate.is_active
                            ? 'Active'
                            : 'Inactive'}
                    </td>

                    <td class="actions">

                        <button
                            class="secondary"
                            data-edit-candidate="${candidate.id}"
                        >
                            Edit
                        </button>

                        <button
                            class="danger"
                            data-delete-candidate="${candidate.id}"
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `).join('')

            : `
                <tr>
                    <td colspan="6" class="empty-cell">
                        No candidates have been added yet.
                    </td>
                </tr>
            `;

    } catch (error) {

        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;

        alert(error.message, 'error');
    }
}


/* =========================================================
   DAILY STATUSES
   ========================================================= */

async function loadStatuses() {

    const body = $('statusRows');

    body.innerHTML = `
        <tr>
            <td colspan="8" class="empty-cell">
                Loading statuses…
            </td>
        </tr>
    `;


    const query = new URLSearchParams();


    const candidate =
        $('filterCandidate').value;

    const dateFrom =
        $('filterDateFrom').value;

    const dateTo =
        $('filterDateTo').value;


    if (candidate) {
        query.set('candidate_id', candidate);
    }


    if (dateFrom) {
        query.set('date_from', dateFrom);
    }


    if (dateTo) {
        query.set('date_to', dateTo);
    }


    // Prevent an invalid date range from reaching the API.
    if (dateFrom && dateTo && dateFrom > dateTo) {

        body.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    Date from cannot be later than date to.
                </td>
            </tr>
        `;

        alert(
            'Date from cannot be later than date to.',
            'error'
        );

        return;
    }


    try {

        statuses = await request(
            `/api/statuses${
                query.size ? '?' + query.toString() : ''
            }`
        );


        body.innerHTML = statuses.length

            ? statuses.map(status => `

                <tr>

                    <td>
                        ${status.status_date}
                    </td>

                    <td>
                        <b>
                            ${escapeHtml(
                                nameFor(status.candidate_id)
                            )}
                        </b>

                    </td>

                    <td
                        class="truncate"
                        title="${escapeHtml(
                            status.work_completed
                        )}"
                    >
                        ${escapeHtml(
                            status.work_completed
                        )}
                    </td>

                    <td
                        class="truncate"
                        title="${escapeHtml(
                            status.topics_learned
                        )}"
                    >
                        ${escapeHtml(
                            status.topics_learned
                        )}
                    </td>

                    <td
                        class="truncate"
                        title="${escapeHtml(
                            status.blockers
                        )}"
                    >
                        ${escapeHtml(
                            status.blockers
                        )}
                    </td>

                    <td
                        class="truncate"
                        title="${escapeHtml(
                            status.next_day_plan
                        )}"
                    >
                        ${escapeHtml(
                            status.next_day_plan
                        )}
                    </td>

                    <td class="completion">
                        ${status.completion_percentage}%
                    </td>

                    <td class="actions">

                        <button
                            class="secondary"
                            data-edit-status="${status.id}"
                        >
                            Edit
                        </button>

                        <button
                            class="danger"
                            data-delete-status="${status.id}"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `).join('')

            : `
                <tr>
                    <td colspan="8" class="empty-cell">
                        No daily statuses match these filters.
                    </td>
                </tr>
            `;

    } catch (error) {

        body.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;

        alert(error.message, 'error');
    }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

    const date = $('dashboardDate').value;


    if (!date) {

        alert(
            'Please select a report date.',
            'error'
        );

        return;
    }


    try {

        const data = await request(
            `/api/dashboard/summary?date=${encodeURIComponent(date)}`
        );


        /* -----------------------------------------------
           Dashboard statistics
           ----------------------------------------------- */

        $('activeCount').textContent =
            data.total_active_candidates;

        $('submittedCount').textContent =
            data.submitted_count;

        $('missingCount').textContent =
            data.missing_count;

        $('averageCompletion').textContent =
            `${data.average_completion_percentage}%`;


        /* -----------------------------------------------
           Submitted candidates
           ----------------------------------------------- */

        $('submittedList').innerHTML =
            data.submitted_candidates?.length

            ? data.submitted_candidates
                .map(candidate => `
                    <div class="list-row">

                        <span>

                            <b>
                                ${escapeHtml(
                                    candidate.full_name
                                )}
                            </b>

                        </span>

                        <span class="completion">
                            ${candidate.completion_percentage}%
                        </span>

                    </div>
                `)
                .join('')

            : `
                <div class="empty">
                    No candidates submitted a report
                    for this date.
                </div>
            `;


        /* -----------------------------------------------
           Missing candidates
           ----------------------------------------------- */

        $('missingList').innerHTML =
            data.missing_candidates?.length

            ? data.missing_candidates
                .map(candidate => `
                    <div class="list-row">

                        <span>

                            <b>
                                ${escapeHtml(
                                    candidate.full_name
                                )}
                            </b>

                        </span>

                        <span class="missing">
                            Missing
                        </span>

                    </div>
                `)
                .join('')

            : `
                <div class="empty">
                    Everyone has submitted a report.
                    Great work!
                </div>
            `;


        /* -----------------------------------------------
           Latest status from every candidate
           ----------------------------------------------- */

        const latestStatuses =
            [...(data.latest_statuses || [])]
                .sort((a, b) => {

                    const completionA =
                        a.completion_percentage ?? -1;

                    const completionB =
                        b.completion_percentage ?? -1;

                    return completionB - completionA;
                });


        $('latestStatusList').innerHTML =
            latestStatuses.length

            ? latestStatuses
                .map(status => {

                    const hasStatus =
                        status.status_id !== null &&
                        status.status_id !== undefined;

                    return `
                        <div class="list-row">

                            <span>

                                <b>
                                    ${escapeHtml(
                                        status.full_name
                                    )}
                                </b>

                                <br>

                                <small>

                                    ${
                                        hasStatus
                                            ? ` · Latest status: ${status.status_date}`
                                            : ' · No status submitted yet'
                                    }
                                </small>

                            </span>

                            ${
                                hasStatus

                                    ? `
                                        <span class="completion">
                                            ${status.completion_percentage}%
                                        </span>
                                    `

                                    : `
                                        <span class="missing">
                                            No status
                                        </span>
                                    `
                            }

                        </div>
                    `;
                })
                .join('')

            : `
                <div class="empty">
                    No active candidates found.
                </div>
            `;


    } catch (error) {

        alert(error.message, 'error');

        $('latestStatusList').innerHTML = `
            <div class="empty">
                Unable to load latest statuses.
            </div>
        `;
    }
}


/* =========================================================
   RESET FORMS
   ========================================================= */

function resetCandidate() {

    $('candidateForm').reset();

    $('candidateEditId').value = '';

    $('candidateActive').checked = true;

    $('candidateTitle').textContent =
        'Add candidate';

    $('candidateSubmit').textContent =
        'Create candidate';

    $('cancelCandidate')
        .classList.add('hidden');
}


function resetStatus() {

    $('statusForm').reset();

    $('statusEditId').value = '';

    $('statusDate').value = today;

    $('statusTitle').textContent =
        'Add daily status';

    $('statusSubmit').textContent =
        'Save status';

    $('cancelStatus')
        .classList.add('hidden');
}


/* =========================================================
   DELETE
   ========================================================= */

async function remove(path, label) {

    if (!confirm(
        'Are you sure you want to delete this item?'
    )) {
        return;
    }


    try {

        await request(path, {
            method: 'DELETE'
        });


        alert(
            `${label} deleted successfully.`
        );


        await loadCandidates();

        await loadStatuses();

        await loadDashboard();


    } catch (error) {

        alert(
            error.message,
            'error'
        );
    }
}


/* =========================================================
   APPLICATION STARTUP
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        $('todayLabel').textContent =
            new Intl.DateTimeFormat(
                undefined,
                { dateStyle: 'full' }
            ).format(new Date());


        $('dashboardDate').value = today;

        $('statusDate').value = today;


        /* -----------------------------------------------
           Initial data loading
           ----------------------------------------------- */

        await loadCandidates();

        await Promise.all([
            loadStatuses(),
            loadDashboard()
        ]);


        /* -----------------------------------------------
           Dashboard
           ----------------------------------------------- */

        $('dashboardForm').onsubmit =
            event => {

                event.preventDefault();

                loadDashboard();
            };


        /* -----------------------------------------------
           Refresh candidates
           ----------------------------------------------- */

        $('refreshCandidates').onclick =
            loadCandidates;


        /* -----------------------------------------------
           Candidate form
           ----------------------------------------------- */

        $('candidateForm').onsubmit =
            async event => {

                event.preventDefault();


                const id =
                    $('candidateEditId').value;


                const payload = {

                    full_name:
                        $('candidateName')
                            .value
                            .trim(),

                    email:
                        $('candidateEmail')
                            .value
                            .trim(),

                    training_track:
                        $('candidateTrack')
                            .value
                            .trim(),

                    is_active:
                        $('candidateActive')
                            .checked
                };


                try {

                    await request(
                        `/api/candidates${
                            id ? '/' + id : ''
                        }`,
                        {
                            method: id
                                ? 'PUT'
                                : 'POST',

                            body:
                                JSON.stringify(payload)
                        }
                    );


                    alert(
                        id
                            ? 'Candidate updated successfully.'
                            : 'Candidate created successfully.'
                    );


                    resetCandidate();

                    await loadCandidates();

                    await loadDashboard();


                } catch (error) {

                    alert(
                        error.message,
                        'error'
                    );
                }
            };


        /* -----------------------------------------------
           Status form
           ----------------------------------------------- */

        $('statusForm').onsubmit =
            async event => {

                event.preventDefault();


                const id =
                    $('statusEditId').value;


                const payload = {

                    candidate_id:
                        +$('statusCandidate').value,

                    status_date:
                        $('statusDate').value,

                    work_completed:
                        $('workCompleted')
                            .value
                            .trim(),

                    topics_learned:
                        $('topicsLearned')
                            .value
                            .trim(),

                    blockers:
                        $('blockers')
                            .value
                            .trim(),

                    next_day_plan:
                        $('nextPlan')
                            .value
                            .trim(),

                    completion_percentage:
                        +$('completion').value
                };


                try {

                    await request(
                        `/api/statuses${
                            id ? '/' + id : ''
                        }`,
                        {
                            method: id
                                ? 'PUT'
                                : 'POST',

                            body:
                                JSON.stringify(payload)
                        }
                    );


                    alert(
                        id
                            ? 'Daily status updated successfully.'
                            : 'Daily status created successfully.'
                    );


                    resetStatus();

                    await loadStatuses();

                    await loadDashboard();


                } catch (error) {

                    alert(
                        error.message,
                        'error'
                    );
                }
            };


        /* -----------------------------------------------
           Status filters
           ----------------------------------------------- */

        $('filters').onsubmit =
            event => {

                event.preventDefault();

                loadStatuses();
            };


        $('clearFilters').onclick =
            () => {

                $('filters').reset();

                loadStatuses();
            };


        /* -----------------------------------------------
           Cancel buttons
           ----------------------------------------------- */

        $('cancelCandidate').onclick =
            resetCandidate;

        $('cancelStatus').onclick =
            resetStatus;


        /* -----------------------------------------------
           Edit/Delete buttons
           ----------------------------------------------- */

        document.onclick =
            event => {

                const button =
                    event.target.closest('button');


                if (!button) {
                    return;
                }


                /* Delete candidate */

                if (button.dataset.deleteCandidate) {

                    return remove(
                        `/api/candidates/${button.dataset.deleteCandidate}`,
                        'Candidate'
                    );
                }


                /* Delete status */

                if (button.dataset.deleteStatus) {

                    return remove(
                        `/api/statuses/${button.dataset.deleteStatus}`,
                        'Daily status'
                    );
                }


                /* Edit candidate */

                if (button.dataset.editCandidate) {

                    const candidate =
                        candidates.find(
                            item =>
                                item.id ===
                                +button.dataset.editCandidate
                        );


                    if (!candidate) {
                        return;
                    }


                    $('candidateEditId').value =
                        candidate.id;

                    $('candidateName').value =
                        candidate.full_name;

                    $('candidateEmail').value =
                        candidate.email;

                    $('candidateTrack').value =
                        candidate.training_track;

                    $('candidateActive').checked =
                        candidate.is_active;


                    $('candidateTitle').textContent =
                        'Edit candidate';

                    $('candidateSubmit').textContent =
                        'Update candidate';

                    $('cancelCandidate')
                        .classList.remove('hidden');


                    $('candidates')
                        .scrollIntoView();
                }


                /* Edit status */

                if (button.dataset.editStatus) {

                    const status =
                        statuses.find(
                            item =>
                                item.id ===
                                +button.dataset.editStatus
                        );


                    if (!status) {
                        return;
                    }


                    $('statusEditId').value =
                        status.id;

                    $('statusCandidate').value =
                        status.candidate_id;

                    $('statusDate').value =
                        status.status_date;

                    $('workCompleted').value =
                        status.work_completed;

                    $('topicsLearned').value =
                        status.topics_learned;

                    $('blockers').value =
                        status.blockers;

                    $('nextPlan').value =
                        status.next_day_plan;

                    $('completion').value =
                        status.completion_percentage;


                    $('statusTitle').textContent =
                        'Edit daily status';

                    $('statusSubmit').textContent =
                        'Update status';

                    $('cancelStatus')
                        .classList.remove('hidden');


                    $('statuses')
                        .scrollIntoView();
                }
            };
    }
);
