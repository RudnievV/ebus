import EventEmitter from 'node:events';

export type BusName = string | symbol;
export type EventName = string | symbol;
type BusMap = Map<
  BusName,
  EventBus
>;
type EventListener = (...args: any[]) => void

type EventBusOptions = {
  wildcard?: boolean;
  maxListeners?: number;
}

/**
 * EventBus flexible event bus emit/pubsub
 *
 * @name EventBus
 */
export default class EventBus {
  private static _instances: BusMap = new Map() as BusMap;

  private name: BusName = 'GLOBAL';
  private eventBus: EventEmitter | null = null;
  private options: EventBusOptions = {
    wildcard: false,
    maxListeners: 50
  };

  private constructor() {
  }

  /**
   * Get EventBus instance
   *
   * @param {string|Symbol} name
   * @param {Object} [options]
   * @param {boolean} [options.wildcard=false] Is use wildcard for emit, listenerCount and removeAllListeners methods
   * @param {number} [options.maxListeners=50] Max number of listeners
   */
  public static getInstance(name: BusName = 'GLOBAL', options?: EventBusOptions): EventBus {
    if (!EventBus._instances.has(name)) {
      const instance = new EventBus();
      instance.init(name, options);
      EventBus._instances.set(name, instance);
    }
    return EventBus._instances.get(name) as EventBus;
  }

  private init(name: BusName, options?: EventBusOptions) {
    this.name = name;
    this.eventBus = getEventBus(name);
    this.options = {
      ...this.options,
      ...options || {}
    };
    this.setMaxListeners(this.options?.maxListeners || 50);
  }

  /**
   * @param {string|Symbol} name
   * @return {boolean}
   */
  public static hasBus(name: BusName): boolean {
    return EventBus._instances.has(name);
  }

  /**
   * @return {EventEmitter}
   */
  getBus(): EventEmitter | null {
    return this.eventBus;
  }

  /**
   * @return {string|Symbol}
   */
  getBusName(): BusName {
    return this.name;
  }

  /**
   * Remove EventBus instance and corresponding EventEmitter
   */
  public close() {
    if (!EventBus._instances.has(this.name)) {
      return;
    }
    EventBus._instances.delete(this.name);
    removeEventBus(this.name);
  }

  /**
   * Alias for `addListener(eventName, listener)` {@link addListener}
   *
   * @param {string|Symbol} eventName
   * @param {function} listener
   * @return {EventBus}
   */
  public on(eventName: EventName, listener: EventListener): EventBus {
    this.addListener(eventName, listener);
    return this;
  }

  /**
   * Adds a **one-time**`listener` function for the event named `eventName`. The
   * next time `eventName` is triggered, this listener is removed and then invoked
   *
   * @param {string|Symbol} eventName
   * @param {function} listener
   * @return {EventBus}
   */
  public once(eventName: EventName, listener: EventListener): EventBus {
    this.eventBus?.once(eventName, listener);
    return this;
  }

  /**
   * Alias for `removeListener(eventName, listener)` {@link removeListener}
   *
   * @param {string|Symbol} eventName
   * @param {function} listener
   * @return {EventBus}
   */
  public off(eventName: EventName, listener: EventListener): EventBus {
    this.removeListener(eventName, listener);
    return this;
  }

  /**
   * Adds the `listener` function to the end of the listeners array for the
   * event named `eventName`. No checks are made to see if the `listener` has
   * already been added. Multiple calls passing the same combination of `eventName`
   * and `listener` will result in the `listener` being added, and called,
   * multiple times
   *
   * @param {string|Symbol} eventName
   * @param {function} listener
   * @return {EventBus}
   */
  public addListener(eventName: EventName, listener: EventListener): EventBus {
    const maxListeners = this.options.maxListeners || 50;
    if ((this.eventBus?.listenerCount(eventName) || 0) >= maxListeners) {
      return this;
    }
    this.eventBus?.addListener(eventName, listener);
    return this;
  }

  /**
   * Removes the specified `listener` from the listener array for the event named`eventName`
   *
   * @param {string|Symbol} eventName
   * @param {function} listener
   * @return {EventBus}
   */
  public removeListener(eventName: EventName, listener: EventListener): EventBus {
    this.eventBus?.removeListener(eventName, listener);
    return this;
  }

  /**
   * Removes all listeners, or those of the specified `eventName`
   *
   * @param {string|Symbol} eventName
   * @return {void}
   */
  public removeAllListeners(eventName: EventName): void {
    this.matchedEventNames(eventName).forEach(name => {
      this.eventBus?.removeAllListeners(name);
    });
  }

  /**
   * By default, `EventEmitter`s will print a warning if more than `10` listeners are
   * added for a particular event. This is a useful default that helps to find
   * memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
   * modified for this specific `EventEmitter` instance
   *
   * @param {number} maxListeners
   * @return {EventBus}
   */
  public setMaxListeners(maxListeners: number): EventBus {
    this.options.maxListeners = maxListeners;
    this.eventBus?.setMaxListeners(maxListeners);
    return this;
  }

  /**
   * Returns the current max listener value for the `EventEmitter` which is either
   * set by `emitter.setMaxListeners(n)`
   *
   * @return {number}
   */
  public getMaxListeners(): number {
    return this.eventBus?.getMaxListeners() || 0;
  }

  /**
   * Returns a copy of the array of listeners for the event named `eventName`
   *
   * @param {string|Symbol} eventName
   * @return {function[]}
   */
  public listeners(eventName: EventName): EventListener[] {
    return this.eventBus?.listeners(eventName) as EventListener[] || [];
  }

  /**
   * Synchronously calls each of the listeners registered for the event
   * named`eventName`, in the order they were registered, passing the
   * supplied arguments to each
   *
   * @param {string|Symbol} eventName
   * @param {any[]} args
   * @return {Map<string|Symbol, boolean>}
   */
  public emit(eventName: EventName, ...args: any[]): Map<EventName, boolean> {
    return this.matchedEventNames(eventName).reduce((map, name) => {
      map.set(name, this.eventBus?.emit(name, ...args) || false);
      return map;
    }, new Map<EventName, boolean>());
  }

  /**
   * Returns an array listing the events for which the emitter has registered
   * listeners. The values in the array are strings or `Symbol`s
   *
   * @return {{string|Symbol}[]}
   */
  public eventNames(): EventName[] {
    return this.eventBus?.eventNames() || [];
  }

  /**
   * Returns a matched array listing the events for which the emitter has registered
   * listeners. The values in the array are strings or `Symbol`s
   *
   * @return {{string|Symbol}[]}
   */
  public matchedEventNames(eventName: EventName): EventName[] {
    if (typeof eventName === 'symbol') {
      return [eventName];
    }
    if (!this.options.wildcard) {
      return [eventName];
    }
    const reg = new RegExp(eventName);
    return this.eventNames().filter(name => {
      return reg.test(name.toString());
    });
  }

  /**
   * Returns the number of listeners listening for the event named `eventName`.
   * If `listener` is provided, it will return how many times the listener is found
   * in the list of the listeners of the event
   *
   * @param {string|Symbol} eventName
   */
  public listenerCount(eventName: EventName): number {
    return this.matchedEventNames(eventName)
      .reduce((acc, name) => acc + (this.eventBus?.listenerCount(name) || 0), 0);
  }
}

const eventBusesMap = new Map();

/**
 * Return specific EventEmitter by name
 * @param {string|Symbol} name
 */
export const getEventBus = (name: BusName = 'GLOBAL'): EventEmitter => {
  if (!eventBusesMap.has(name)) {
    eventBusesMap.set(name, new EventEmitter());
  }

  return eventBusesMap.get(name);
};

/**
 * Remove specific EventEmitter by name
 * @param {string|Symbol} name
 */
export const removeEventBus = (name: BusName = 'GLOBAL'): void => {
  if (eventBusesMap.has(name)) {
    eventBusesMap.delete(name);
  }
};

/**
 * Check if specific EventEmitter by name exists
 * @param {string|Symbol} name
 */
export const hasEventBus = (name: BusName = 'GLOBAL'): boolean => {
  return eventBusesMap.has(name);
};
