<template>
    <select v-model="selectedPortName">
        <option v-for="portName of portNames" :key="portName"/>
    </select>
</template>


<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import shimi from 'shimi';

@Component({})
export default class MidiOutPicker extends Vue {
    @Prop() public midiOut!: shimi.MidiOut;
    @Prop() public midiAccess!: shimi.MidiAccess;

    get portNames(): string[] {
        if (!this.midiAccess) {
            return [];
        }
        return this.midiAccess.getOutPorts();
    }

    get selectedPortName(): string {
        if (!this.midiOut || !this.midiOut.port) {
            return '';
        }
        return this.midiOut.port.name;
    }

    set selectedPortName(value: string) {
        if (!this.midiOut || !this.midiOut.port) {
            return;
        }
        if (this.midiOut.port.name === value) {
            return;
        }
        this.midiOut.port = this.midiAccess.getOutPort(value);
    }
}
</script>
