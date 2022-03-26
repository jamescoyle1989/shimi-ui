import { shallowMount } from '@vue/test-utils'
import MidiInPicker from '@/components/MidiInPicker.vue'
import { MidiAccess, MidiIn } from 'shimi'
import DummyBaseAccess from '../DummyBaseAccess'

describe('MidiInPicker', () => {
    let cmp;
    beforeEach(() => cmp = shallowMount(MidiInPicker));

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
            expect(portNames[0]).toEqual('Test 3');
            expect(portNames[1]).toEqual('Test 4');
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
            expect(cmp.vm.midiIn).toBeUndefined();
            expect(cmp.vm.selectedPortName).toEqual('');
        }),
        it('Returns port name if set', async () => {
            const baseAccess = new DummyBaseAccess();
            const port = new MidiIn(baseAccess.inputs[0]);
            await cmp.setProps({ 
                midiAccess: new MidiAccess(baseAccess),
                midiIn: port
            });
            expect(cmp.vm.midiAccess).not.toBeUndefined();
            expect(cmp.vm.midiIn).not.toBeUndefined();
            expect(cmp.vm.selectedPortName).toEqual('Test 3');
        }),
        it('Setting selectedPortName updates midiIn if port name found', async () => {
            const baseAccess = new DummyBaseAccess();
            const port = new MidiIn(baseAccess.inputs[0]);
            await cmp.setProps({ 
                midiAccess: new MidiAccess(baseAccess),
                midiIn: port
            });
            expect(cmp.vm.selectedPortName).toEqual('Test 3');
            cmp.vm.selectedPortName = 'Test 4';
            expect(cmp.vm.midiIn.port).toEqual(baseAccess.inputs[1]);
        }),
        it('Setting selectedPortName nulls midiIn if port name not found', async () => {
            const baseAccess = new DummyBaseAccess();
            const basePort = baseAccess.inputs[0];
            await cmp.setProps({ 
                midiAccess: new MidiAccess(baseAccess),
                midiIn: new MidiIn(basePort)
            });
            expect(cmp.vm.selectedPortName).toEqual('Test 3');
            cmp.vm.selectedPortName = 'Test 1';
            expect(cmp.vm.midiIn.port).toBeNull();
        })
    })
})
