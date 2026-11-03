import { gsap } from 'gsap';
import { AREAS, adjustDays, rankedCandidates, type Area, type AreaChoice, type AreaMode, type EquipmentPreference } from '../lib/exercise-fit';
import { loadLibrary, nameOf, type Library } from '../lib/exercise-library';
import {
  BACKOFF_REPS_PRESETS,
  REPS_PRESETS,
  REST_PRESETS,
  STRUCTURE_OPTIONS,
  TOP_REPS_PRESETS,
  answersPlan,
  defaultRestFor,
  estimateMinutes,
  hasBackoff,
  planDetail,
  prescription,
  recommendedAnswers,
  summaryText,
  withBackoffPreset,
  withRepsPreset,
  withRest,
  withRir,
  withSets,
  withStructure,
} from '../lib/plan-answers';
import { EXPERIENCE_OPTIONS, buildWeek, dayOptions, recommendedDays, sessionSets, type Experience } from '../lib/routine-assistant';
import {
  MAX_PRIORITY_MUSCLES,
  MIN_WEEKS_FOR_FINAL_WEEK,
  MUSCLE_LABELS,
  RAMP_FREQUENCIES,
  STEP_TITLES,
  WEEK_PRESETS,
  WIZARD_STEPS,
  canContinue,
  finalWeekHint,
  formatSteps,
  initialWizard,
  nameError,
  parseWeeks,
  rampWeeks,
  startDateFor,
  stepSteps,
  todayIso,
  toggleDeloadOption,
  toggleMuscle,
  type FinalWeekMode,
  type StartChoice,
  type WizardStep,
} from '../lib/routine-wizard';
import { TEMPLATES, type Session, type Template } from '../lib/routine-templates';

// The full routine assistant of Fittë in the hero: the same eight steps, in the same order, as the app. Everything rendered
// comes from constants, the exercise library or escaped text, never from raw user input.
const EQUIPMENT_OPTIONS: { value: EquipmentPreference; label: string; hint: string }[] = [
  { value: 'FULL_GYM', label: 'Full gym', hint: 'Barbells, dumbbells, cables and machines.' },
  { value: 'FREE_WEIGHTS', label: 'Dumbbells and barbell', hint: 'Free weights, no machines.' },
  { value: 'MACHINES', label: 'Machines and cables', hint: 'Guided, easier to control.' },
  { value: 'HOME', label: 'Home, little equipment', hint: 'Bodyweight, bands and dumbbells.' },
];

const AREA_LABELS: Record<Area, { label: string; noun: string }> = {
  KNEE: { label: 'Knee', noun: 'your knee' },
  SHOULDER: { label: 'Shoulder', noun: 'your shoulder' },
  LOWER_BACK: { label: 'Lower back', noun: 'your lower back' },
  ELBOW: { label: 'Elbow', noun: 'your elbow' },
  WRIST: { label: 'Wrist', noun: 'your wrist' },
  HIP: { label: 'Hip', noun: 'your hip' },
  NECK: { label: 'Neck', noun: 'your neck' },
};

const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const joinWords = (words: string[]): string => (words.length <= 1 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`);
const dateLabel = (iso: string): string => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export function wireWizard(root: HTMLElement, animate: boolean): void {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const body = $('[data-body]');
  const progress = $('[data-progress]');
  const label = $('[data-step-label]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const hint = $('[data-hint]');

  let state = initialWizard();
  let step: WizardStep | 'done' = 'experience';
  let library: Library | null = null;
  let libraryRequested = false;
  const options = dayOptions(TEMPLATES);

  const template = (): Template => options.find((o) => o.daysPerWeek === state.days)!.templates[state.variant] ?? options.find((o) => o.daysPerWeek === state.days)!.templates[0];
  const areaChoices = (): AreaChoice[] => AREAS.flatMap((area) => (state.areas[area] ? [{ area, mode: state.areas[area] as AreaMode }] : []));

  function requestLibrary(): void {
    if (libraryRequested) return;
    libraryRequested = true;
    void loadLibrary().then((lib) => {
      library = lib;
      if (step === 'preview') render(false);
    });
  }

  // ---------- Steps ----------
  const cards = (name: string, items: { value: string; label: string; hint: string }[], current: string | null, act: string): string =>
    `<div class="cards">${items
      .map((o) => `<input type="radio" id="${name}-${o.value}" name="${name}" value="${o.value}" data-act="${act}" ${o.value === current ? 'checked' : ''}><label for="${name}-${o.value}"><b>${o.label}</b><small>${o.hint}</small></label>`)
      .join('')}</div>`;

  const chipRow = (name: string, items: { value: string; label: string; cls?: string }[], current: string | null, act: string): string =>
    `<div class="chips-row">${items
      .map((o) => `<input type="radio" id="${name}-${o.value}" name="${name}" value="${o.value}" data-act="${act}" ${o.value === current ? 'checked' : ''}><label for="${name}-${o.value}" class="${o.cls ?? ''}">${o.label}</label>`)
      .join('')}</div>`;

  const stepper = (act: string, value: string, minusOff: boolean, plusOff: boolean, name: string): string =>
    `<div class="stepper"><button type="button" data-act="${act}" data-val="-1" aria-label="Fewer ${name}" ${minusOff ? 'disabled' : ''}>-</button><output>${value}</output><button type="button" data-act="${act}" data-val="1" aria-label="More ${name}" ${plusOff ? 'disabled' : ''}>+</button></div>`;

  const weekStrip = (t: Template): string =>
    `<div class="week" role="group" aria-label="Your week, ${esc(t.name)}">${buildWeek(t)
      .map((d) => (d.session ? `<div class="cell"><small>Day ${d.day}</small><b>${esc(d.session.name)}</b></div>` : `<div class="cell cell--rest"><small>Day ${d.day}</small><b>Rest</b></div>`))
      .join('')}</div>`;

  const views: Record<WizardStep, () => string> = {
    experience: () => cards('exp', EXPERIENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint })), state.experience, 'exp'),
    days: () => {
      const rec = recommendedDays(options, state.experience);
      const five = options.find((o) => o.daysPerWeek === state.days)!;
      return `<p class="step-note">Recommended for ${EXPERIENCE_OPTIONS.find((e) => e.value === state.experience)!.label.toLowerCase()}: ${rec ?? 'none'} days.</p>
        ${chipRow('days', options.map((o) => ({ value: String(o.daysPerWeek), label: String(o.daysPerWeek), cls: o.daysPerWeek === rec ? 'is-rec' : '' })), String(state.days), 'days')}
        ${five.templates.length > 1 ? chipRow('variant', five.templates.map((t, i) => ({ value: String(i), label: esc(t.name) })), String(state.variant), 'variant') : ''}
        ${weekStrip(template())}`;
    },
    duration: () => {
      const custom = !WEEK_PRESETS.includes(state.weeks);
      return `${chipRow('weeks', WEEK_PRESETS.map((w) => ({ value: String(w), label: `${w} weeks${w === 12 ? ' (default)' : ''}` })), custom ? null : String(state.weeks), 'weeks')}
        <label class="field" for="weeks-other"><span>Other, from 4 to 52 weeks</span><input id="weeks-other" data-input="weeks" type="text" inputmode="numeric" autocomplete="off" value="${custom ? state.weeks : ''}" placeholder="For example 10"></label>
        <p class="step-note" data-weeks-error aria-live="polite"></p>`;
    },
    equipment: () => cards('equip', EQUIPMENT_OPTIONS, state.equipment, 'equip') + `<p class="step-note">Choose one to continue.</p>`,
    injuries: () =>
      `<p class="step-note">Optional. Tap the areas that bother you. There are no studies that validate swapping gym exercises to treat an injury: the lists are a cautious heuristic from biomechanics and expert opinion, and an exercise being on a list does not mean it is bad.</p>
       <div class="chips-row">${AREAS.map((area) => `<button type="button" class="toggle" data-act="area" data-val="${area}" aria-pressed="${state.areas[area] ? 'true' : 'false'}">${AREA_LABELS[area].label}</button>`).join('')}</div>
       ${AREAS.filter((a) => state.areas[a])
         .map((a) => `<div class="mode"><span>${AREA_LABELS[a].label}</span><div class="seg">${(['AVOID', 'GRADUAL'] as const).map((m) => `<button type="button" data-act="mode" data-area="${a}" data-val="${m}" aria-pressed="${state.areas[a] === m}">${m === 'AVOID' ? 'Avoid what loads it' : 'Carry on carefully'}</button>`).join('')}</div></div>`)
         .join('')}`,
    plan: () => {
      const a = state.answers;
      const top = a.structure === 'TOP_BACKOFF';
      const pyramid = a.structure === 'PYRAMID';
      const presets = top ? TOP_REPS_PRESETS : REPS_PRESETS;
      return `${cards('struct', STRUCTURE_OPTIONS, a.structure, 'struct')}
        <div class="row"><span>Sets per exercise</span>${stepper('sets', String(a.sets), a.sets <= (pyramid ? 2 : 1), a.sets >= 30, 'sets')}</div>
        ${pyramid ? `<p class="step-note">Reps per set, spread evenly: ${a.pyramidReps.join(', ')}.</p>` : `<div class="field-group"><span>${top ? 'Reps of the top set' : 'Reps per set'}</span>${chipRow('reps', presets.map(([lo, hi]) => ({ value: `${lo}-${hi}`, label: `${lo}-${hi}` })), `${a.repsMin}-${a.repsMax}`, 'reps')}</div>`}
        ${hasBackoff(a) ? `<div class="field-group"><span>Reps of the back-offs</span>${chipRow('backoff', BACKOFF_REPS_PRESETS.map(([lo, hi]) => ({ value: `${lo}-${hi}`, label: `${lo}-${hi}` })), `${a.backoffMin}-${a.backoffMax}`, 'backoff')}</div>` : ''}
        <div class="row"><span>${a.structure === 'STRAIGHT' ? 'RIR (reps left in the tank)' : 'RIR of the ' + (pyramid ? 'heaviest set' : 'top set')}</span>${stepper('top', String(a.topRir), a.topRir <= 0, a.topRir >= 5, 'RIR')}</div>
        ${a.structure === 'STRAIGHT' || a.sets < 2 ? '' : `<div class="row"><span>RIR of the ${pyramid ? 'other sets' : 'back-offs'}</span>${stepper('back', String(a.backoffRir), a.backoffRir <= 0, a.backoffRir >= 5, 'back-off RIR')}</div>`}
        <div class="field-group"><span>Rest</span>${chipRow('rest', [{ value: 'auto', label: 'Automatic' }, ...REST_PRESETS.map((s) => ({ value: String(s), label: `${s / 60 >= 1 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : '0:' + s}` }))], a.rest === null ? 'auto' : String(a.rest), 'rest')}</div>
        <p class="summary">${esc(summaryText(a))}</p>
        <p class="step-note">The app also lets you set a different plan for single exercises. Not in this demo.</p>`;
    },
    preview: () => previewView(),
    confirm: () => confirmView(),
  };

  // ---------- Preview ----------
  interface Row { slot: string; day: number; slug: string; original: string; reasons: string[]; care: Area[]; unresolved: boolean; candidates: string[] }

  function routineRows(): { day: number; session: Session; rows: Row[] }[] {
    const t = template();
    const week = buildWeek(t).filter((d) => d.session);
    const needs = state.equipment !== 'FULL_GYM' || Object.keys(state.areas).length > 0;
    const days = week.map((d) => ({ order: d.day, exercises: d.session!.exercises.map((e) => library?.bySlug.get(e.exercise)).filter((e): e is NonNullable<typeof e> => !!e) }));
    const result = library && needs ? adjustDays({ days, library: library.all, equipment: state.equipment ?? 'FULL_GYM', areas: areaChoices() }) : null;
    return week.map((d) => {
      const taken = new Set(d.session!.exercises.map((e) => library?.bySlug.get(e.exercise)?.id ?? -1));
      return {
        day: d.day,
        session: d.session!,
        rows: d.session!.exercises.map((e) => {
          const fit = library?.bySlug.get(e.exercise);
          const swap = fit && result?.swaps.find((s) => s.dayOrder === d.day && s.exerciseId === fit.id);
          const replacement = swap ? library!.all.find((x) => x.id === swap.replacementId) : undefined;
          const slot = `${d.day}:${e.exercise}`;
          const slug = state.picks[slot] ?? replacement?.slug ?? e.exercise;
          const candidates = fit && library
            ? rankedCandidates(fit, library.all, { equipment: state.equipment ?? 'FULL_GYM', avoid: AREAS.filter((a) => state.areas[a] === 'AVOID'), taken }).slice(0, 8).map((c) => c.slug)
            : [];
          return {
            slot, day: d.day, slug, original: e.exercise,
            reasons: swap ? swap.reasons.map((r) => (r === 'EQUIPMENT' ? 'your equipment' : AREA_LABELS[r].noun)) : [],
            care: result?.gradual.filter((g) => g.dayOrder === d.day && (g.exerciseId === fit?.id || g.exerciseId === library?.bySlug.get(slug)?.id)).flatMap((g) => g.areas) ?? [],
            unresolved: !!fit && !!result?.unresolved.some((u) => u.dayOrder === d.day && u.exerciseId === fit.id),
            candidates,
          };
        }),
      };
    });
  }

  function previewView(): string {
    const needs = state.equipment !== 'FULL_GYM' || Object.keys(state.areas).length > 0;
    if (needs && !library) return libraryRequested ? '<p class="step-note">Loading the exercise library to adjust your routine...</p>' : '<p class="step-note">The exercise library is not available, so the routine is shown as the template.</p>';
    const days = routineRows();
    const total = days.reduce((sum, d) => sum + sessionSets({ name: d.session.name, exercises: d.session.exercises.map((e) => ({ ...e, sets: state.answers.sets })) }), 0);
    return `<p class="step-note">${esc(template().name)}, ${state.days} days a week, ${state.weeks} weeks, ${total} sets a week.</p>
      ${days.map(({ day, session, rows }) => {
        const plans = rows.map((r) => answersPlan(state.answers, defaultRestFor(library?.bySlug.get(r.slug)?.mechanic ?? 'compound')));
        return `<section class="day"><h3>Day ${day}, ${esc(session.name)}<span>${rows.length} exercises, about ${estimateMinutes(plans)} min</span></h3><ul>${rows.map((r, i) => {
          const changed = r.slug !== r.original;
          const note = r.reasons.length ? `Changed because of ${joinWords(r.reasons)}.` : changed ? 'Changed by you.' : r.unresolved ? 'No similar substitute, kept.' : r.care.length ? `Load ${joinWords(r.care.map((a) => AREA_LABELS[a].noun))} gradually.` : '';
          return `<li><div><b>${esc(nameOf(library, r.slug))}</b>${note ? `<small>${esc(note)}</small>` : ''}${changed ? `<small>Was ${esc(nameOf(library, r.original))}</small>` : ''}</div><span>${esc(prescription(plans[i]))}<small>${esc(planDetail(plans[i]))}</small></span>
            ${r.candidates.length ? `<select data-act="pick" data-slot="${esc(r.slot)}" aria-label="Change ${esc(nameOf(library, r.slug))}"><option value="${esc(r.original)}">${changed ? 'Back to the original' : 'Change exercise'}</option>${r.candidates.filter((c) => c !== r.original).map((c) => `<option value="${esc(c)}" ${c === r.slug ? 'selected' : ''}>${esc(nameOf(library, c))}</option>`).join('')}</select>` : ''}</li>`;
        }).join('')}</ul></section>`;
      }).join('')}`;
  }

  // ---------- Confirm ----------
  function confirmView(): string {
    const err = state.name === '' ? '' : (nameError(state.name) ?? '');
    const today = todayIso();
    const ramp = state.ramp;
    const weeks = rampWeeks(ramp.everyWeeks, state.weeks, state.finalWeek.mode);
    const finalOk = state.weeks >= MIN_WEEKS_FOR_FINAL_WEEK;
    return `<label class="field" for="name"><span>Name of the routine</span><input id="name" data-input="name" type="text" autocomplete="off" maxlength="90" value="${esc(state.name)}" placeholder="For example Push Pull Legs"></label>
      <p class="step-note" data-name-error aria-live="polite">${esc(err)}</p>
      <div class="field-group"><span>Start</span>${chipRow('start', [{ value: 'TODAY', label: 'Today' }, { value: 'TOMORROW', label: 'Tomorrow' }, { value: 'DATE', label: 'Pick a date' }], state.start, 'start')}
        ${state.start === 'DATE' ? `<label class="field" for="start-date"><span>Start date</span><input id="start-date" data-input="date" type="date" min="${today}" value="${esc(state.customDate)}"></label>` : ''}</div>
      <div class="row"><span>Steps goal, training day</span>${stepper('tsteps', formatSteps(state.trainingSteps), false, false, 'training day steps')}</div>
      <div class="row"><span>Steps goal, rest day</span>${stepper('rsteps', formatSteps(state.restSteps), false, false, 'rest day steps')}</div>
      <div class="field-group"><span>Final week</span>${chipRow('fw', [{ value: 'NONE', label: 'None' }, { value: 'DEVOLUME', label: 'Devolume' }, { value: 'DELOAD', label: 'Deload' }], finalOk ? state.finalWeek.mode : 'NONE', 'fw')}
        ${state.finalWeek.mode === 'DELOAD' ? `<div class="chips-row"><button type="button" class="toggle" data-act="fwopt" data-val="fewerSets" aria-pressed="${state.finalWeek.fewerSets}">Fewer sets</button><button type="button" class="toggle" data-act="fwopt" data-val="higherRir" aria-pressed="${state.finalWeek.higherRir}">Higher RIR</button></div>` : ''}
        ${finalWeekHint(state.finalWeek) ? `<p class="step-note">${esc(finalWeekHint(state.finalWeek))}</p>` : ''}</div>
      <div class="field-group"><span>Progressive volume</span><div class="chips-row"><button type="button" class="toggle" data-act="ramp" aria-pressed="${ramp.enabled}">${ramp.enabled ? 'On' : 'Off'}</button></div>
        ${ramp.enabled ? `<p class="step-note">Pick up to ${MAX_PRIORITY_MUSCLES} priority muscles.</p><div class="chips-row">${Object.entries(MUSCLE_LABELS).map(([k, v]) => `<button type="button" class="toggle" data-act="muscle" data-val="${k}" aria-pressed="${ramp.muscles.includes(k)}">${v}</button>`).join('')}</div>
        ${chipRow('every', RAMP_FREQUENCIES.map((n) => ({ value: String(n), label: `Every ${n} weeks` })), String(ramp.everyWeeks), 'every')}
        <p class="step-note">${ramp.muscles.length === 0 ? 'Choose at least one muscle.' : weeks.length === 0 ? `With ${state.weeks} weeks and a rise every ${ramp.everyWeeks} there is no week to rise: pick a smaller number.` : `In weeks ${joinWords(weeks.map(String))} we suggest adding sets on one of your ${joinWords(ramp.muscles.map((m) => MUSCLE_LABELS[m]))} days: +1 set on each exercise of that muscle. You decide whether to accept it.`}</p>` : ''}</div>`;
  }

  // ---------- Rendering ----------
  function doneView(): string {
    const start = startDateFor(state.start, todayIso(), state.customDate);
    return `<div class="done"><span class="done__check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <h3>Routine created</h3><p>${esc(state.name.trim())} starts ${start ? esc(dateLabel(start)) : 'soon'}.</p>
      <ul><li>${esc(template().name)}, ${state.days} days a week for ${state.weeks} weeks</li><li>${esc(summaryText(state.answers))}</li><li>${formatSteps(state.trainingSteps)} steps on training days and ${formatSteps(state.restSteps)} on rest days</li></ul>
      <p class="done__note">This is a demo, nothing was saved.</p><button type="button" class="btn btn--ink" data-act="restart">Start again</button></div>`;
  }

  function render(motion: boolean, direction = 1): void {
    const active = document.activeElement as HTMLElement | null;
    const key = active && body.contains(active) ? active.id || active.dataset.val && `${active.dataset.act}:${active.dataset.val}:${active.dataset.area ?? ''}` : null;
    root.classList.toggle('is-done', step === 'done');
    if (step === 'done') {
      progress.innerHTML = '';
      label.textContent = '';
      body.innerHTML = doneView();
      back.hidden = true;
      next.hidden = true;
      hint.textContent = '';
    } else {
      const index = WIZARD_STEPS.indexOf(step);
      progress.innerHTML = WIZARD_STEPS.map((_, i) => `<i class="${i <= index ? 'on' : ''}"></i>`).join('');
      label.textContent = `Step ${index + 1} of ${WIZARD_STEPS.length}, ${STEP_TITLES[step]}`;
      body.innerHTML = views[step]();
      back.hidden = index === 0;
      next.hidden = false;
      next.textContent = step === 'confirm' ? 'Create routine' : 'Next';
      refreshNext();
    }
    if (key) {
      const el = (document.getElementById(key) ?? body.querySelector<HTMLElement>(`[data-act][data-val]`)) as HTMLElement | null;
      const [act, val, area] = key.split(':');
      (document.getElementById(key) ?? [...body.querySelectorAll<HTMLElement>('[data-act]')].find((e) => e.dataset.act === act && e.dataset.val === val && (e.dataset.area ?? '') === (area ?? '')) ?? el)?.focus({ preventScroll: true });
    }
    if (motion && animate) {
      gsap.fromTo(body.children, { x: 18 * direction, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', stagger: 0.04 });
      if (step === 'done') gsap.fromTo('.done__check', { scale: 0.4 }, { scale: 1, duration: 0.7, ease: 'back.out(2)' });
    }
  }

  function refreshNext(): void {
    if (step === 'done') return;
    const ok = canContinue(state, step);
    next.disabled = !ok;
    hint.textContent = ok ? '' : step === 'equipment' ? 'Choose what you train with.' : 'Write a name and a valid start date.';
  }

  function go(delta: number): void {
    if (step === 'done') return;
    const index = WIZARD_STEPS.indexOf(step) + delta;
    if (index < 0) return;
    if (index >= WIZARD_STEPS.length) { step = 'done'; render(true, 1); return; }
    step = WIZARD_STEPS[index];
    if (step !== 'experience') requestLibrary();
    render(true, delta);
  }

  // ---------- Events ----------
  body.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button[data-act]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    const val = target.dataset.val ?? '';
    const delta = Number(val) as 1 | -1;
    switch (target.dataset.act) {
      case 'sets': state = { ...state, answers: withSets(state.answers, state.answers.sets + delta) }; break;
      case 'top': state = { ...state, answers: withRir(state.answers, 'topRir', delta) }; break;
      case 'back': state = { ...state, answers: withRir(state.answers, 'backoffRir', delta) }; break;
      case 'tsteps': state = { ...state, trainingSteps: stepSteps(state.trainingSteps, delta) }; break;
      case 'rsteps': state = { ...state, restSteps: stepSteps(state.restSteps, delta) }; break;
      case 'area': { const { [val as Area]: current, ...rest } = state.areas; state = { ...state, areas: current ? rest : { ...rest, [val as Area]: 'AVOID' }, picks: {} }; break; }
      case 'mode': state = { ...state, areas: { ...state.areas, [target.dataset.area as Area]: val as AreaMode }, picks: {} }; break;
      case 'fwopt': state = { ...state, finalWeek: toggleDeloadOption(state.finalWeek, val as 'fewerSets' | 'higherRir') }; break;
      case 'ramp': state = { ...state, ramp: { ...state.ramp, enabled: !state.ramp.enabled } }; break;
      case 'muscle': state = { ...state, ramp: toggleMuscle(state.ramp, val) }; break;
      case 'restart': state = initialWizard(); step = 'experience'; render(true, -1); return;
      default: return;
    }
    render(false);
  });

  body.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    const act = input.dataset.act;
    if (!act) return;
    const val = input.value;
    switch (act) {
      case 'exp': {
        const experience = val as Experience;
        const rec = recommendedDays(options, experience);
        state = { ...state, experience, days: rec ?? state.days, variant: 0, answers: recommendedAnswers(experience) };
        break;
      }
      case 'days': state = { ...state, days: Number(val), variant: 0 }; break;
      case 'variant': state = { ...state, variant: Number(val) }; break;
      case 'weeks': state = { ...state, weeks: Number(val) }; break;
      case 'equip': state = { ...state, equipment: val as EquipmentPreference, picks: {} }; break;
      case 'struct': state = { ...state, answers: withStructure(state.answers, val as 'TOP_BACKOFF' | 'STRAIGHT' | 'PYRAMID') }; break;
      case 'reps': { const [lo, hi] = val.split('-').map(Number); state = { ...state, answers: withRepsPreset(state.answers, [lo, hi]) }; break; }
      case 'backoff': { const [lo, hi] = val.split('-').map(Number); state = { ...state, answers: withBackoffPreset(state.answers, [lo, hi]) }; break; }
      case 'rest': state = { ...state, answers: withRest(state.answers, val === 'auto' ? null : Number(val)) }; break;
      case 'start': state = { ...state, start: val as StartChoice }; break;
      case 'fw': state = { ...state, finalWeek: { ...state.finalWeek, mode: val as FinalWeekMode } }; break;
      case 'every': state = { ...state, ramp: { ...state.ramp, everyWeeks: Number(val) } }; break;
      case 'pick': {
        const slot = input.dataset.slot ?? '';
        const original = slot.split(':')[1];
        const { [slot]: _removed, ...rest } = state.picks;
        state = { ...state, picks: val === original ? rest : { ...rest, [slot]: val } };
        break;
      }
      default: return;
    }
    render(false);
  });

  // Text fields update the state without redrawing, so the caret stays where it is.
  body.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement;
    switch (input.dataset.input) {
      case 'weeks': {
        const weeks = parseWeeks(input.value);
        const message = body.querySelector('[data-weeks-error]');
        if (weeks !== null) state = { ...state, weeks };
        if (message) message.textContent = input.value === '' || weeks !== null ? '' : 'Write a whole number from 4 to 52.';
        break;
      }
      case 'name': {
        state = { ...state, name: input.value };
        const message = body.querySelector('[data-name-error]');
        if (message) message.textContent = input.value === '' ? '' : (nameError(input.value) ?? '');
        break;
      }
      case 'date': state = { ...state, customDate: input.value }; break;
      default: return;
    }
    refreshNext();
  });

  back.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  // Touch: swipe the body left for the next step and right for the previous one. The body follows the finger with some
  // resistance, springs back if the swipe is short or the step is not answered yet, and vertical scrolling stays native.
  if (matchMedia('(pointer: coarse)').matches) {
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let axis: 'x' | 'y' | null = null;
    let tracking = false;
    body.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      tracking = !(e.target as HTMLElement).closest('input, select, textarea');
      startX = t.clientX;
      startY = t.clientY;
      dx = 0;
      axis = null;
    }, { passive: true });
    body.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      const t = e.touches[0];
      dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) axis = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
      if (axis === 'x' && animate) gsap.set(body, { x: dx * 0.45, autoAlpha: 1 - Math.min(0.5, Math.abs(dx) / 420) });
    }, { passive: true });
    const settle = () => {
      if (!tracking || axis !== 'x' || step === 'done') { tracking = false; return; }
      tracking = false;
      const direction = dx < 0 ? 1 : -1;
      const index = WIZARD_STEPS.indexOf(step);
      const allowed = Math.abs(dx) > 70 && (direction === -1 ? index > 0 : canContinue(state, step));
      const blocked = Math.abs(dx) > 70 && direction === 1 && !canContinue(state, step);
      if (allowed) {
        gsap.set(body, { x: 0, autoAlpha: 1 });
        navigator.vibrate?.(10);
        go(direction);
        return;
      }
      if (blocked) navigator.vibrate?.([6, 40, 6]);
      if (animate) {
        if (blocked) gsap.fromTo(body, { x: -10 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'elastic.out(1, 0.35)' });
        else gsap.to(body, { x: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' });
      }
    };
    body.addEventListener('touchend', settle, { passive: true });
    body.addEventListener('touchcancel', settle, { passive: true });
  }
  render(false);
}

