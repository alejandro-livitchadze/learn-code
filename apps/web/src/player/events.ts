import type { EventSink, PlayerEvent } from './types';

export class ConsoleEventSink implements EventSink {
  emit(event: PlayerEvent): void {
    console.debug('[event]', event);
  }
}
