import EventBus, { hasEventBus } from '../src';
import { expect } from 'chai';

describe('EventBus instances', () => {
  const globalEb = EventBus.getInstance();
  const testEb = EventBus.getInstance('test');

  const symbolName = Symbol('test');
  const symbolEb = EventBus.getInstance(symbolName);

  after(() => {
    globalEb?.close();
    testEb?.close();
    symbolEb?.close();
  });

  it('should EventBus instance', () => {
    expect(globalEb).to.be.instanceof(EventBus);
  });

  it('default EB name should be a string GLOBAL', () => {
    expect(globalEb.getBusName()).to.be.a('string').and.equal('GLOBAL');
  });

  it('default EB should get the same instance', () => {
    expect(globalEb).to.equal(EventBus.getInstance());
  });

  it('default EB should get the same instance as GLOBAL', () => {
    expect(globalEb).to.equal(EventBus.getInstance('GLOBAL'));
  });

  it('test EB name should be "test"', () => {
    expect(testEb.getBusName()).to.be.a('string').and.equal('test');
  });

  it('test EB should get the same instance', () => {
    expect(testEb).to.equal(EventBus.getInstance('test'));
  });

  it('symbol EB name should be a symbol', () => {
    expect(symbolEb.getBusName()).to.be.a('symbol').and.equal(symbolName);
  });

  it('symbol EB should get the same instance', () => {
    expect(symbolEb).to.equal(EventBus.getInstance(symbolName));
  });

  it('test EB should disappear after close', () => {
    testEb.close();
    expect(EventBus.hasBus('test')).to.be.false;
    expect(hasEventBus('test')).to.be.false;
  });

  it('symbol EB should disappear after close', () => {
    symbolEb.close();
    expect(EventBus.hasBus(symbolName)).to.be.false;
    expect(hasEventBus(symbolName)).to.be.false;
  });
});

describe('EventBus add/remove', () => {
  const globalEb = EventBus.getInstance();
  const listener1 = () => {
  };
  const listener2 = () => {
  };

  after(() => {
    globalEb?.close();
  });

  it('should add and remove 1 listener (with off)', () => {
    globalEb.on('test', listener1);
    expect(globalEb.listenerCount('test')).to.equal(1);
    globalEb.off('test', listener1);
    expect(globalEb.listenerCount('test')).to.equal(0);
  });

  it('should add and remove 2 listeners', () => {
    globalEb
      .on('test', listener1)
      .on('test', listener2);
    expect(globalEb.listenerCount('test')).to.equal(2);
    globalEb.removeListener('test', listener1);
    expect(globalEb.listenerCount('test')).to.equal(1);
    globalEb.removeListener('test', listener2);
    expect(globalEb.listenerCount('test')).to.equal(0);
  });

  it('should remove all listeners', () => {
    globalEb
      .on('test', listener1)
      .addListener('test', listener2);
    expect(globalEb.listenerCount('test')).to.equal(2);
    globalEb.removeAllListeners('test');
    expect(globalEb.listenerCount('test')).to.equal(0);
  });
});

describe('EventBus emit', () => {
  const globalEb = EventBus.getInstance();

  after(() => {
    globalEb?.close();
  });

  afterEach(() => {
    globalEb?.removeAllListeners('test');
  });

  it('should emit', () => {
    let i = 0;
    globalEb.on('add', () => {
      i++;
    });
    globalEb.emit('add');
    expect(i).to.be.equal(1);
  });

  it('should emit once', () => {
    let i = 0;
    globalEb.once('add', () => {
      i++;
    });
    globalEb.emit('add');
    globalEb.emit('add');
    expect(i).to.be.equal(1);
  });

  it('should emit twice', () => {
    let i = 0;
    globalEb.on('add', () => {
      i++;
    });
    globalEb.emit('add');
    globalEb.emit('add');
    expect(i).to.be.equal(2);
  });

  it('should emit with params', () => {
    let i = 0;
    globalEb.once('add', (add) => {
      i += add;
    });
    globalEb.emit('add', 3);
    expect(i).to.be.equal(3);
  });
});

describe('EventBus max listeners', () => {
  const maxListenersEb = EventBus.getInstance('maxListeners', {
    maxListeners: 3
  });

  after(() => {
    maxListenersEb?.close();
  });

  afterEach(() => {
    maxListenersEb?.removeAllListeners('calk');
  });

  it('should set maxListeners via options', () => {
    expect(maxListenersEb.getMaxListeners()).to.be.equal(3);
  });

  it('should work maxListeners via options', () => {
    let i = 1;
    maxListenersEb
      .on('calk', (add) => i += add)
      .on('calk', (sub) => i -= sub)
      .on('calk', (mul) => i *= mul)
      .on('calk', (div) => i /= div)
      .emit('calk', 10);
    expect(maxListenersEb.listenerCount('calk')).to.be.equal(3);
    expect(i).to.be.equal(10);
  });

  it('should set maxListeners via options', () => {
    maxListenersEb.setMaxListeners(2);
    expect(maxListenersEb.getMaxListeners()).to.be.equal(2);
  });

  it('should work maxListeners via method', () => {
    expect(maxListenersEb.listenerCount('calk')).to.be.equal(0);
    let i = 1;
    maxListenersEb
      .on('calk', (add) => i += add)
      .on('calk', (sub) => i -= sub)
      .on('calk', (mul) => i *= mul)
      .on('calk', (div) => i /= div)
      .emit('calk', 10);

    expect(maxListenersEb.listenerCount('calk')).to.be.equal(2);
    expect(i).to.be.equal(1);
  });
});

describe('EventBus eventNames', () => {
  const eventNamesEb = EventBus.getInstance('eventNames', {
    wildcard: true
  });

  after(() => {
    eventNamesEb?.close();
  });

  it('should work eventNames', () => {
    const names = eventNamesEb
      .on('one', () => {
      })
      .on('two', () => {
      })
      .on('three', () => {
      })
      .eventNames();
    expect(names).deep.be.equal(['one', 'two', 'three']);
  });

  it('should work matchedEventNames', () => {
    const names = eventNamesEb
      .on('e1', () => {
      })
      .on('e2', () => {
      })
      .on('e3', () => {
      })
      .matchedEventNames('e\\d+');
    expect(names).deep.be.equal(['e1', 'e2', 'e3']);
  });
});

describe('EventBus wildcard', () => {
  let i = 1;
  const wildcardEb = EventBus.getInstance('wildcardEb', {
    wildcard: true
  });

  after(() => {
    wildcardEb?.close();
  });

  afterEach(() => {
    i = 1;
    wildcardEb?.removeAllListeners('wildcard.*');
  });

  const addF = (add: number) => i += add;
  const subF = (sub: number) => i -= sub;
  const mulF = (mul: number) => i *= mul;
  const divF = (div: number) => i /= div;

  const addListener = () => wildcardEb
    .on('wildcard.add', addF)
    .on('wildcard.sub', subF)
    .on('wildcard.mul', mulF)
    .on('wildcard.div', divF);

  it('should work listenerCount method', () => {
    addListener();
    expect(wildcardEb.listenerCount('wildcard.*')).to.be.equal(4);
  });

  it('should work removeAllListeners method', () => {
    addListener().removeAllListeners('wildcard.*');
    expect(wildcardEb.listenerCount('wildcard.*')).to.be.equal(0);
  });

  it('should work wildcard emit', () => {
    addListener().emit('wildcard.*', 10);
    expect(i).to.be.equal(1);
  });

  it('should work wildcard emit and with single', () => {
    addListener()
      .emit('wildcard.add', 2);

    wildcardEb.emit('wildcard.*', 10);
    expect(i).to.be.equal(3);
  });

  it('should work wildcard emit and with single', () => {
    addListener()
      .emit('wildcard.add', 2);

    wildcardEb
      .removeListener('wildcard.div', divF)
      .emit('wildcard.*', 10);
    expect(i).to.be.equal(30);
  });

  it('should remove by wildcard', () => {
    addListener();

    wildcardEb
      .removeAllListeners('wildcard.\[div|mul\]');

    expect(wildcardEb.eventNames()).deep.be.equal(['wildcard.add', 'wildcard.sub']);
  });
});
