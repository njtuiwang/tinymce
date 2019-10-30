import { document } from '@ephox/dom-globals';
import { Assertions, Pipeline, Step, TestLogs } from '@ephox/agar';
import { Merger } from '@ephox/katamari';
import { DomEvent, Element, EventUnbinder, Html, Insert, Remove } from '@ephox/sugar';

import { AlloyComponent } from '../component/ComponentApi';
import * as Attachment from '../system/Attachment';
import * as Gui from '../system/Gui';
import TestStore from './TestStore';

/**
 * @deprecated use guiSetup instead.
 * TODO: remove and inline
 */
const setup = (createComponent: (store: TestStore, doc: Element, body: Element) => AlloyComponent,
               f: (doc: Element, body: Element, gui: Gui.GuiSystem, component: AlloyComponent, store: TestStore) => Array<Step<any, any>>, success, failure) => {
  const store = TestStore();

  const gui = Gui.create();

  const doc = Element.fromDom(document);
  const body = Element.fromDom(document.body);

  Attachment.attachSystem(body, gui);

  const component = createComponent(store, doc, body);
  gui.add(component);

  Pipeline.async({}, f(doc, body, gui, component, store), () => {
    Attachment.detachSystem(gui);
    success();
  }, (e, logs) => {
    // tslint:disable-next-line
    // console.error(e);
    failure(e, logs);
  }, TestLogs.init());
};

/**
 * Setup an editor, run a Step, then tear down.
 * If you need to run multiple Steps, compose them using the functions in StepSequence.
 *
 * @param createComponent
 * @param f
 * @param success
 * @param failure
 */
const guiSetup = <A, B> (createComponent: (store: TestStore, doc: Element, body: Element) => AlloyComponent,
                         f: (doc: Element, body: Element, gui: Gui.GuiSystem, component: AlloyComponent, store: TestStore) => Step<A, B>, success, failure) => {
 setup(createComponent, (doc, body, gui, component, store) => [f(doc, body, gui, component, store)], success, failure);
};

const mSetupKeyLogger = (body) => {
  return Step.stateful((oldState, next, die) => {
    const onKeydown: EventUnbinder = DomEvent.bind(body, 'keydown', (event) => {
      newState.log.push('keydown.to.body: ' + event.raw().which);
    });

    const log: string[] = [ ];
    const newState: any = {
      ...oldState,
      log,
      onKeydown
    };
    next(newState);
  });
};

const mTeardownKeyLogger = (body, expected) => {
  return Step.stateful((state: any, next, die) => {
    Assertions.assertEq('Checking key log outside context (on teardown)', expected, state.log);
    state.onKeydown.unbind();
    const { onKeydown, log, ...rest } = state;
    next(rest);
  });
};

const mAddStyles = (doc, styles) => {
  return Step.stateful((value, next, die) => {
    const style = Element.fromTag('style');
    const head = Element.fromDom(doc.dom().head);
    Insert.append(head, style);
    Html.set(style, styles.join('\n'));

    next(Merger.deepMerge(value, {
      style
    }));
  });
};

const mRemoveStyles = Step.stateful((value: any, next, die) => {
  Remove.remove(value.style);
  next(value);
});

export {
  setup,
  guiSetup,
  mSetupKeyLogger,
  mTeardownKeyLogger,

  mAddStyles,
  mRemoveStyles
};
