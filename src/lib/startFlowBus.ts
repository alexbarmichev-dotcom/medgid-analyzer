export const START_FLOW_EVENT = 'medgid:start-intent';

export type StartIntent = 'anonymous' | 'subscribe';

export interface StartIntentDetail {
  intent: StartIntent;
  tariffId?: string;
}

export const emitStartIntent = (intent: StartIntent, tariffId?: string) => {
  window.dispatchEvent(
    new CustomEvent<StartIntentDetail>(START_FLOW_EVENT, { detail: { intent, tariffId } }),
  );
};
