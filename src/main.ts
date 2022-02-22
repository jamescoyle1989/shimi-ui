import Vue from 'vue';
import wrap from '@vue/web-component-wrapper';


import MidiOutPicker from './components/MidiOutPicker.vue';
const wrappedMidiOutPicker: any = wrap(Vue, MidiOutPicker);
window.customElements.define('midi-out-picker', wrappedMidiOutPicker);
