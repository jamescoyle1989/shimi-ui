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
    name: 'MidiOutPicker',
    props: {
        midiOut: shimi.MidiOut,
        midiAccess: shimi.MidiAccess
    },
    computed: {
        portNames() {
            if (!this.midiAccess)
                return [];
            return this.midiAccess.getOutPorts();
        },
        selectedPortName: {
            get() {
                if (!this.midiOut || !this.midiOut.port)
                    return '';
                return this.midiOut.port.name;
            },
            set(portName) {
                if (!this.midiOut || !this.midiAccess)
                    return;
                if (this.midiOut.port && this.midiOut.port.name === portName)
                    return;
                this.midiOut.port = this.midiAccess.getOutPort(portName);
            }
        }
    }
}
</script>