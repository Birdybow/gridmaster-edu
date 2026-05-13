import { Joyride, STATUS } from 'react-joyride';
import type { EventData } from 'react-joyride';

const TOUR_KEY = 'gridmaster-tour-shown-v14';

const STEPS = [
  {
    target: 'body',
    title: 'Velkommen til GridMaster Edu!',
    content: 'Dette er et interaktivt læringsprogram for elektrofaglig nettberegning. Vil du ta en kort omvisning? Du kan avbryte når som helst.',
    placement: 'center' as const,
    disableBeacon: true,
  },
  {
    target: '[data-tour="toolbar-row1"]',
    title: 'Fil og prosjekt',
    content: 'Her åpner og lagrer du prosjekter lokalt (.gmx), importerer scenarier og eksporterer resultater som PDF eller CSV.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="toolbar-row2"]',
    title: 'Analyse og beregninger',
    content: 'Her starter du nettberegninger: lastflyt, kortslutning, ringnett, vern og mer. Resultatene vises umiddelbart på canvas.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="component-panel"]',
    title: 'Nettbygger',
    content: 'Dra busser, linjer og transformatorer inn på arbeidsflaten for å bygge kraftnettet ditt.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="network-canvas"]',
    title: 'Arbeidsflaten',
    content: 'Her tegner du kraftnettet. Klikk på en buss eller linje for å redigere parametre. Zoom med musehjulet.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="toolbar-row2"]',
    title: 'Beregninger',
    content: 'Trykk "Kjør lastflyt" for å starte Newton-Raphson-beregningen. Resultater vises med fargekoding direkte på canvas.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="toolbar-row1"]',
    title: 'Eksport og rapport',
    content: 'Generer en ferdig PDF-rapport eller eksporter data til CSV for videre analyse i Excel. Prosjektet lagres lokalt som .gmx-fil. Lykke til!',
    disableBeacon: true,
  },
];

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  function handleEvent(data: EventData) {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_KEY, '1');
      onFinish();
    }
  }

  return (
    <Joyride
      steps={STEPS}
      run={run}
      onEvent={handleEvent}
      continuous
      locale={{
        back: 'Tilbake',
        close: 'Lukk',
        last: 'Ferdig',
        next: 'Neste',
        open: 'Åpne',
        skip: 'Hopp over',
      }}
      options={{
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
        primaryColor: '#4FC3F7',
        overlayColor: 'rgba(0,0,0,0.55)',
        zIndex: 9000,
      }}
      styles={{
        tooltip: {
          background: '#0D1B2A',
          borderRadius: 8,
          border: '1px solid #1E3A5F',
          color: '#CFD8DC',
        },
        tooltipTitle: { color: '#4FC3F7' },
        buttonBack: { color: '#607D8B' },
        buttonSkip: { color: '#607D8B' },
        buttonPrimary: { background: '#4FC3F7', color: '#0D1B2A', borderRadius: 4 },
        buttonClose: { color: '#607D8B' },
        overlay: { backgroundColor: 'rgba(0,0,0,0.55)' },
      }}
    />
  );
}

export function shouldStartTour(): boolean {
  return !localStorage.getItem(TOUR_KEY);
}

export function resetTour(): void {
  localStorage.removeItem(TOUR_KEY);
}
