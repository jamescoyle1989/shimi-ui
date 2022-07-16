<template>
    <select v-model="selectedPortName">
        <option v-for="portName of portNames" :key="portName">{{portName}}</option>
    </select>
</template>

<script>
let shimi = window.shimi;
if (shimi === undefined)
    shimi = require('shimi');

export default {
    name: 'MidiInPicker',
    props: {
        midiIn: shimi.MidiIn,
        midiAccess: shimi.MidiAccess
    },
    computed: {
        portNames() {
            if (!this.midiAccess)
                return [];
            return this.midiAccess.getInPortNames();
        },
        selectedPortName: {
            get() {
                if (!this.midiIn || !this.midiIn.port)
                    return '';
                return this.midiIn.port.name;
            },
            set(portName) {
                if (!this.midiIn || !this.midiAccess)
                    return;
                if (this.midiIn.port && this.midiIn.port.name === portName)
                    return;
                this.midiIn.port = this.midiAccess.getInPort(portName);
            }
        }
    }
}
</script>