import { shallowMount } from '@vue/test-utils'
import MidiOutPicker from '@/components/MidiOutPicker.vue'
import { MidiAccess, MidiOut } from 'shimi'
import DummyBaseAccess from '../DummyBaseAccess'

describe('MidiOutPicker', () => {
    let cmp;
    beforeEach(() => cmp = shallowMount(MidiOutPicker));

    describe('portNames', () => {
        it('Returns empty if midiAccess not set', () => {
            expect(cmp.vm.midiAccess).toBeUndefined();
            expect(cmp.vm.portNames.length).toEqual(0);
        }),
        it('Returns list of port names if midiAccess set', async () => {
            await cmp.setProps({ midiAccess: new MidiAccess(new DummyBaseAccess()) });
            expect(cmp.vm.midiAccess).not.toBeUndefined();
            const portNames = cmp.vm.portNames;
            expect(portNames.length).toEqual(2);
            expect(portNames[0]).toEqual('Test 1');
            expect(portNames[1]).toEqual('Test 2');
        })
    }),

    describe('selectedPortName', () => {
        it('Returns empty if midiAccess not set', () => {
            expect(cmp.vm.midiAccess).toBeUndefined();
            expect(cmp.vm.selectedPortName).toEqual('');
        }),
        it('Returns empty if midiAccess set but port not', async () => {
            await cmp.setProps({ midiAccess: new MidiAccess(new DummyBaseAccess()) });
            expect(cmp.vm.midiAccess).not.toBeUndefined();
            expect(cmp.vm.midiOut).toBeUndefined();
            expect(cmp.vm.selectedPortName).toEqual('');
        }),
        it('Returns port name if set', async () => {
            const baseAccess = new DummyBaseAccess();
            const port = new MidiOut(baseAccess.outputs[0]);
            await cmp.setProps({ 
                midiAccess: new MidiAccess(baseAccess),
                midiOut: port
            });
            expect(cmp.vm.midiAccess).not.toBeUndefined();
            expect(cmp.vm.midiOut).not.toBeUndefined();
            expect(cmp.vm.selectedPortName).toEqual('Test 1');
        }),
        it('Setting selectedPortName updates midiOut if port name found', async () => {
            const baseAccess = new DummyBaseAccess();
            const port = new MidiOut(baseAccess.outputs[0]);
            await cmp.setProps({ 
                midiAccess: new MidiAccess(baseAccess),
                midiOut: port
            });
            expect(cmp.vm.selectedPortName).toEqual('Test 1');
            cmp.vm.selectedPortName = 'Test 2';
            expect(cmp.vm.midiOut.port).toEqual(baseAccess.outputs[1]);
        }),
        it('Setting selectedPortName nulls midiOut if port name not found', async () => {
            const baseAccess = new DummyBaseAccess();
            const basePort = baseAccess.outputs[0];
            await cmp.setProps({ 
                midiAccess: new MidiAccess(baseAccess),
                midiOut: new MidiOut(basePort)
            });
            expect(cmp.vm.selectedPortName).toEqual('Test 1');
            cmp.vm.selectedPortName = 'Test 3';
            expect(cmp.vm.midiOut.port).toBeNull();
        })
    })
})
