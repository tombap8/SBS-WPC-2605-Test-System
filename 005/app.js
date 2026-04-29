/**
 * app.js — 능력단위 평가 템플릿 렌더 스크립트
 *
 * 역할 : data.json 을 fetch 하여 각 페이지의 DOM 요소에 바인딩
 *
 * 유지보수 가이드:
 *  · 모든 평가 내용은 data.json 을 수정하세요.
 *    HTML/CSS/JS 파일은 건드리지 않아도 됩니다.
 *  · 채점 항목 추가/삭제 → data.json > detailedScoringItems
 *  · 채점 기준 변경      → data.json > scoringCriteria
 *  · 훈련생 수 변경      → data.json > students 배열 조정
 */

/* ──────────────────────────────────────────────────
   1. JSON 데이터 로드
   ────────────────────────────────────────────────── */
fetch('data.json')
  .then(res => {
    if (!res.ok) throw new Error('data.json 로드 실패: ' + res.status);
    return res.json();
  })
  .then(data => {
    renderAll(data);
    hideLoader();
    initNavHighlight();
  })
  .catch(err => {
    console.error('[평가 템플릿]', err);
    hideLoader();
    document.getElementById('docRoot').insertAdjacentHTML(
      'afterbegin',
      `<div style="padding:20px;color:red;font-weight:700;">
        ⚠ 데이터 로드 오류: ${err.message}<br>
        data.json 파일이 index.html 과 같은 폴더에 있는지 확인하세요.
      </div>`
    );
  });

/* ──────────────────────────────────────────────────
   2. 메인 렌더 함수
   ────────────────────────────────────────────────── */
function renderAll(d) {
  renderCover(d);
  renderSummary(d);
  renderCriteria(d);
  renderSheet(d);
  renderScoreSheet(d);
  renderEvidence(d);
}

/* ──────────────────────────────────────────────────
   3. 페이지별 렌더 함수
   ────────────────────────────────────────────────── */

/**
 * 3-1. 표지 렌더
 */
function renderCover(d) {
  const m  = d.meta;
  const ei = d.evaluationInfo;
  const ui = d.unitInfo;

  setText('cv-year',      m.year);
  setText('cv-program',   m.program);
  setText('cv-subject',   m.subject);
  setText('cv-courseName',m.courseName);
  setText('cv-period',    m.trainingPeriod);
  setText('cv-institution', m.institution);

  /* 목차 행 생성 */
  const tocBody = document.getElementById('cv-toc-body');
  d.tableOfContents.forEach(item => {
    tocBody.insertAdjacentHTML('beforeend',
      `<tr><td>${item.no}</td><td>${item.title}</td></tr>`
    );
  });

  /* NCS 분류 행 */
  const ncsRow = document.getElementById('cv-ncs-row');
  const nc = m.ncsClassification;
  ncsRow.innerHTML =
    `<td>${nc.major}</td><td>${nc.middle}</td><td>${nc.minor}</td><td>${nc.detail}</td>`;
}

/**
 * 3-2. 종합 평가 결과표 렌더
 */
function renderSummary(d) {
  const ei = d.evaluationInfo;
  const ui = d.unitInfo;
  const m  = d.meta;

  setText('sm-course',    m.courseName);
  setText('sm-subject',   m.subject);
  setText('sm-unitName',  ui.unitName);
  setHTML('sm-elements',  ui.elements.join('<br>'));
  setText('sm-date',      ei.date);
  setText('sm-location',  ei.location);
  setText('sm-duration',  ei.duration);
  setText('sm-method',    ei.method);
  setText('sm-evaluator', ei.evaluator);
  setText('sm-headCount', ei.headCount + '명');

  /* 훈련생 목록 행 생성 */
  const body = document.getElementById('sm-student-body');
  d.students.forEach(s => {
    body.insertAdjacentHTML('beforeend',
      `<tr>
        <td style="text-align:center">${s.no}</td>
        <td>${s.name}</td>
        <td style="text-align:center">${s.score ?? ''}</td>
        <td style="text-align:center">${s.pass  ?? ''}</td>
        <td>${s.comment}</td>
      </tr>`
    );
  });
}

/**
 * 3-3. 채점기준표 렌더
 */
function renderCriteria(d) {
  const ei = d.evaluationInfo;
  const ui = d.unitInfo;
  const m  = d.meta;

  setText('cr-course',   m.courseName);
  setText('cr-subject',  m.subject);
  setText('cr-unitName', ui.unitName);
  setHTML('cr-elements', ui.elements.join('<br>'));
  setText('cr-date',     ei.date);
  setText('cr-location', ei.location);
  setText('cr-duration', ei.duration);
  setText('cr-method',   ei.method);

  const body = document.getElementById('cr-criteria-body');

  /**
   * 카테고리별로 rowspan 을 계산하여 첫 번째 항목에만 카테고리 셀 출력
   * → 외형이 PDF 원본과 동일하게 병합됨
   */
  d.scoringCriteria.forEach(group => {
    const rowspan = group.items.length;
    group.items.forEach((item, idx) => {
      const catCell = idx === 0
        ? `<td class="cat-cell" rowspan="${rowspan}">${group.category}</td>`
        : '';
      body.insertAdjacentHTML('beforeend',
        `<tr>
          ${catCell}
          <td>${item.criterion}</td>
          <td>${item.scores.high}</td>
          <td>${item.scores.mid}</td>
          <td>${item.scores.low}</td>
        </tr>`
      );
    });
  });
}

/**
 * 3-4. 훈련생 평가지 렌더
 */
function renderSheet(d) {
  const ei = d.evaluationInfo;
  const ui = d.unitInfo;
  const m  = d.meta;
  const ec = d.evaluationContent;

  setText('sh-instructor', ei.instructor);
  setText('sh-course',     m.courseName);
  setText('sh-subject',    m.subject);
  setText('sh-unitCode',   `[${ui.unitCode}]\n${ui.unitName}/${ui.unitLevel}`);
  setHTML('sh-elements',   ui.elements.join('<br>'));
  setText('sh-date',       ei.date);
  setText('sh-location',   ei.location);
  setText('sh-duration',   ei.duration);
  setText('sh-method',     '과정평가 : ' + ei.method);

  /* 평가 설명 */
  setText('sh-description', ec.description);

  /* 작업지시서 */
  const tasksEl = document.getElementById('sh-tasks');
  ec.tasks.forEach(task => {
    let html = `<p><strong>${task.no}. ${task.title}</strong></p>`;
    if (task.description) html += `<p class="task-indent-1">${task.description}</p>`;

    /* 하위 항목(subItems) */
    if (task.subItems) {
      task.subItems.forEach(sub => {
        html += `<p class="task-indent-1">${sub.no} ${sub.title}</p>`;
        if (sub.details) {
          sub.details.forEach(det => {
            html += `<p class="task-indent-2">${det}</p>`;
          });
        }
      });
    }

    /* 요구사항 목록 */
    if (task.requirements) {
      task.requirements.forEach(req => {
        html += `<p style="padding-left:16px">${req}</p>`;
      });
    }

    tasksEl.insertAdjacentHTML('beforeend', html);
  });

  /* 제출 방법 */
  const sub = d.submissionInfo;
  const subEl = document.getElementById('sh-submission');
  subEl.innerHTML =
    `<p>1. 제출파일형식: ${sub.format}</p>
     <p>2. 파일명 : ${sub.fileName}</p>
     <p class="task-indent-2">${sub.additionalFiles}</p>`;
}

/**
 * 3-5. 훈련생 채점지 렌더
 */
function renderScoreSheet(d) {
  const ei = d.evaluationInfo;
  const ui = d.unitInfo;
  const m  = d.meta;

  setText('sc-evaluator', ei.evaluator);
  setText('sc-course',    m.courseName);
  setText('sc-subject',   m.subject);
  setText('sc-unitCode',  `[${ui.unitCode}]\n${ui.unitName}/${ui.unitLevel}`);
  setHTML('sc-elements',  ui.elements.join('<br>'));
  setText('sc-date',      ei.date);
  setText('sc-location',  ei.location);
  setText('sc-duration',  ei.duration);
  setText('sc-method',    '과정평가 : ' + ei.method);

  /* 채점 항목 총점 계산 (항목 수 × 5) */
  let totalItems = 0;
  d.detailedScoringItems.forEach(g => { totalItems += g.items.length; });
  setText('sc-total', totalItems * 5);

  /* 채점표 행 생성 */
  const body = document.getElementById('sc-score-body');
  d.detailedScoringItems.forEach(group => {
    const rowspan = group.items.length;
    group.items.forEach((item, idx) => {
      const catCell = idx === 0
        ? `<td class="cat-cell" rowspan="${rowspan}">${group.category}</td>`
        : '';
      /* 5~1 점 셀 */
      const scoreCells = [5,4,3,2,1].map(n =>
        `<td class="score-num">${n}</td>`
      ).join('');
      body.insertAdjacentHTML('beforeend',
        `<tr>
          ${catCell}
          <td>${item.no} ${item.description}</td>
          ${scoreCells}
        </tr>`
      );
    });
  });

  /* 성취수준 테이블 */
  d.achievementLevels.forEach((lv, i) => {
    const key = 5 - i; // 5, 4, 3, 2, 1
    const el  = document.getElementById(`ach-${key}`);
    if (el) el.textContent = `${lv.label}\n(${lv.range})`;
  });
}

/**
 * 3-6. 평가근거자료 렌더
 */
function renderEvidence(d) {
  const ei = d.evaluationInfo;
  const ui = d.unitInfo;
  const m  = d.meta;

  setText('ev-instructor', ei.instructor);
  setText('ev-course',     m.courseName);
  setText('ev-subject',    m.subject);
  setText('ev-unitCode',   `[${ui.unitCode}]\n${ui.unitName}/${ui.unitLevel}`);
  setHTML('ev-elements',   ui.elements.join('<br>'));
  setText('ev-location',   ei.location);
  setText('ev-duration',   ei.duration);
  setText('ev-method',     '과정평가 : ' + ei.method);
}

/* ──────────────────────────────────────────────────
   4. 유틸리티 함수
   ────────────────────────────────────────────────── */

/** 텍스트 설정 (존재하지 않는 ID 는 경고만 출력) */
function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) { console.warn('[setText] id 없음:', id); return; }
  el.textContent = value ?? '';
}

/** HTML 설정 */
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (!el) { console.warn('[setHTML] id 없음:', id); return; }
  el.innerHTML = html ?? '';
}

/** 로딩 오버레이 숨기기 */
function hideLoader() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => overlay.remove(), 500);
  }
}

/* ──────────────────────────────────────────────────
   5. 스크롤 기반 네비게이션 하이라이트
   ────────────────────────────────────────────────── */
function initNavHighlight() {
  const pages  = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  pages.forEach(p => observer.observe(p));
}
