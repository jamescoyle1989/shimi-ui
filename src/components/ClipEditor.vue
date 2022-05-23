<template>
    <div :style="{width: width, height: height}">
        <div ref="scroller" class="sh-clip-scroller">

            <!-- Left piano bar -->
            <div ref="pianoBar" class="sh-clip-pianobar">

                <div v-for="p of pitches" :key="p"
                    :class="{
                        'sh-clip-black-key': pitchIsBlack(p),
                        'sh-clip-white-key': !pitchIsBlack(p),
                        'sh-clip-pitch-separator': pitchAboveIsSameColor(p)
                    }"
                    :style="{height: pitchHeight + 'px'}">

                    <label v-if="p % 12 == octaveLabelPitch">{{getOctaveLabel(p)}}</label>
                </div>
            </div>

            <svg :viewBox="'0 0 ' + (clipDuration * beatWidth) + ' ' + (pitches.length * pitchHeight)"
                preserveAspectRatio="none" fill="#666666"
                ref="svgElement" class="sh-clip-edit-area"
                @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"
                :width="clipDuration * beatWidth" :height="pitches.length * pitchHeight">

                <rect x="0" y="0" :width="clipDuration * beatWidth" :height="pitches.length * pitchHeight" fill="#666"/>

                <rect v-for="p of blackPitches" :key="'p' + p"
                    x="0" :y="getPitchY(p)" :width="clipDuration * beatWidth" :height="pitchHeight" fill="#555"/>

                <line v-for="p of pitches.filter(x => pitchAboveIsSameColor(x))" :key="'ps' + p"
                    x1="0" :y1="getPitchY(p)"
                    :x2="clipDuration * beatWidth" :y2="getPitchY(p)"
                    class="sh-clip-pitch-separator"/>

                <line v-for="line of beatLines" :key="'b' + line.beat"
                    :x1="line.beat * beatWidth" y1="-10"
                    :x2="line.beat * beatWidth" :y2="(pitches.length + 1) * pitchHeight"
                    :class="line.class"/>

                <rect v-for="n of clipNotes.filter(x => getPitchY(x.pitch))" :key="n.id"
                    :x="n.start * beatWidth" :y="getPitchY(n.pitch)"
                    :height="pitchHeight" :width="n.duration * beatWidth"
                    stroke="black" stroke-width="0.5"
                    :fill="getNoteColor(n)"/>
            </svg>
        </div>
    </div>
</template>


<script>
import { ClipNote } from 'shimi';
let shimi = window.shimi;
if (shimi === undefined)
    shimi = require('shimi');

import { safeMod } from '../utils';

export default {
    name: 'ClipEditor',
    props: {
        clip: shimi.Clip,
        beatsPerBar: {
            type: Number,
            default: 4
        },
        divisionsPerBeat: {
            type: Number,
            default: 2
        },
        xZoom: {
            type: Number,
            default: 1
        },
        yZoom: {
            type: Number,
            default: 1
        },
        scale: shimi.Scale,
        minPitch: {
            type: Number,
            default: 0
        },
        maxPitch: {
            type: Number,
            default: 127
        },
        width: {
            type: String,
            default: '1200px'
        },
        height: {
            type: String,
            default: '800px'
        },
        addNote: {
            type: [Boolean, Function],
            default: true
        },
        editNote: {
            type: [Boolean, Function],
            default: true
        },
        deleteNote: {
            type: [Boolean, Function],
            default: true
        },
        noteColor: {
            type: [String, Function],
            default: '#07A340'
        }
    },
    data: () => {
        return {
            svgPoint: null,
            selectedNote: null,
            dragMode: null,
            dragOffset: 0
        }
    },
    mounted() {
        if (this.$refs.svgElement) {
            try {
                this.svgPoint = this.$refs.svgElement.createSVGPoint();
            } catch { }
        }
        if (this.$refs.scroller) {
            const self = this;
            this.$refs.scroller.addEventListener('scroll', function() {
                self.$refs.pianoBar.style.marginLeft = self.$refs.scroller.scrollLeft;
            });
        }
    },
    computed: {
        pitches() {
            const output = [];
            for (let i = this.safeMaxPitch; i >= this.safeMinPitch; i--) {
                if (this.scale && !this.scale.contains(i))
                    continue;
                output.push(i);
            }
            return output;
        },
        octaveLabelPitch() {
            if (!this.scale)
                return 0;
            return Math.min(...this.scale.pitches);
        },
        blackPitches() {
            return this.pitches.filter(x => this.pitchIsBlack(x) && this.getPitchY(x) != null);
        },
        clipDuration() {
            if (this.clip)
                return this.clip.duration;
            return 0;
        },
        clipNotes() {
            if (this.clip)
                return this.clip.notes;
            return [];
        },
        safeBeatsPerBar() {
            if (this.beatsPerBar <= 0)
                return 1;
            return this.beatsPerBar;
        },
        safeDivisionsPerBeat() {
            const rounded = Math.round(this.divisionsPerBeat);
            if (rounded <= 0)
                return 1;
            return rounded;
        },
        pitchHeight() {
            if (this.yZoom <= 0)
                return 10;
            return this.yZoom * 10;
        },
        beatWidth() {
            if (this.xZoom <= 0)
                return 100;
            return this.xZoom * 100;
        },
        beatLines() {
            const linesPerBar = [{ beat: 0, class: 'sh-clip-bar-line' }];
            for (let i = 0; i < this.safeBeatsPerBar; i++) {
                if (i > 0)
                    linesPerBar.push({beat: i, class: 'sh-clip-beat-line' });
                for (let j = 1; j < this.safeDivisionsPerBeat; j++) {
                    const divisionBeat = i + (j / this.safeDivisionsPerBeat);
                    if (divisionBeat < this.safeBeatsPerBar)
                        linesPerBar.push({beat: divisionBeat, class: 'sh-clip-division-line' });
                }
            }

            const output = [];
            for (let barStart = 0; barStart <= this.clipDuration; barStart += this.safeBeatsPerBar) {
                for (const line of linesPerBar) {
                    const lineBeat = barStart + line.beat;
                    if (lineBeat >= 0 && lineBeat <= this.clipDuration)
                        output.push({ beat: lineBeat, class: line.class });
                }
            }
            return output;
        },
        safeMinPitch() {
            return Math.min(Math.max(0, Number(this.minPitch)), 127);
        },
        safeMaxPitch() {
            let output = Math.min(Math.max(0, Number(this.maxPitch)), 127);
            if (output < this.safeMinPitch)
                output = this.safeMinPitch;
            return output;
        }
    },
    methods: {
        pitchIsBlack(pitch) {
            const m = pitch % 12;
            return m == 1 || m == 3 || m == 6 || m == 8 || m == 10;
        },
        pitchAboveIsSameColor(pitch) {
            const index = this.pitches.indexOf(pitch);
            if (index == 0)
                return false;
            return this.pitchIsBlack(pitch) == this.pitchIsBlack(this.pitches[index - 1]);
        },
        getNoteColor(clipNote) {
            if (typeof this.noteColor === 'string')
                return this.noteColor;
            const isSelected = clipNote === this.selectedNote;
            return this.noteColor(clipNote, isSelected);
        },
        getCursorBeat(evt) {
            this.svgPoint.x = evt.clientX;
            this.svgPoint.y = evt.clientY;
            const cursorPoint = this.svgPoint.matrixTransform(this.$refs.svgElement.getScreenCTM().inverse());

            return Math.min(Math.max(0, cursorPoint.x / this.beatWidth), this.clipDuration);
        },
        /** beatOffset is how many beats ahead of the point where the mouse is, is the point we actually want to be snapping to */
        getSnappedCursorBeat(evt, beatOffset = 0) {
            this.svgPoint.x = evt.clientX;
            this.svgPoint.y = evt.clientY;
            const cursorPoint = this.svgPoint.matrixTransform(this.$refs.svgElement.getScreenCTM().inverse());

            //How many graphical units there are from one beat division to the next
            const unitsPerDivision = this.beatWidth / this.safeDivisionsPerBeat;
            let diffFromDivision = safeMod(cursorPoint.x + (beatOffset * this.beatWidth), unitsPerDivision);
            if (diffFromDivision > (unitsPerDivision / 2))
                diffFromDivision -= unitsPerDivision;
            if (Math.abs(diffFromDivision) <= 5)
                cursorPoint.x -= diffFromDivision;

            return Math.min(Math.max(0, (cursorPoint.x / this.beatWidth) + beatOffset), this.clipDuration);
        },
        getCursorPitch(evt) {
            this.svgPoint.x = evt.clientX;
            this.svgPoint.y = evt.clientY;
            const cursorPoint = this.svgPoint.matrixTransform(this.$refs.svgElement.getScreenCTM().inverse());

            let index = Math.floor(cursorPoint.y / this.pitchHeight);
            index = Math.min(Math.max(0, index), 127);
            return this.pitches[index];
        },
        getPitchY(pitch) {
            let index = this.pitches.indexOf(pitch);
            if (index < 0)
                return null;
            return index * this.pitchHeight;
        },
        getOctaveLabel(pitch) {
            if (!this.scale)
                return 'C' + (Math.floor(pitch / 12) - 1);
            return this.scale.getPitchName(pitch, true);
        },
        canAddNote(note) {
            if (this.addNote == true || this.addNote == false)
                return this.addNote;
            return this.addNote(note);
        },
        canEditNote(note) {
            if (this.editNote == true || this.editNote == false)
                return this.editNote;
            return this.editNote(note);
        },
        canDeleteNote(note) {
            if (this.deleteNote == true || this.deleteNote == false)
                return this.deleteNote;
            return this.deleteNote(note);
        },

        onMouseDown(evt) {
            if (!this.clip)
                return;
            if (evt.button == 1) {
                this.removeNote(evt);
                return;
            }
            if (evt.button != 0)
                return;
            
            const beat = this.getCursorBeat(evt);
            const pitch = this.getCursorPitch(evt);
            this.selectedNote = this.clipNotes.find(x => x.pitch == pitch && x.contains(beat));
            if (this.selectedNote)
                this.beginNoteDrag(beat);
            else
                this.addNewNote(evt, pitch);
        },
        onMouseMove(evt) {
            if (this.selectedNote && this.dragMode) {
                const newDragBeat = this.getSnappedCursorBeat(evt, this.dragOffset);
                if (this.dragMode == 'full') {
                    this.selectedNote.start = newDragBeat;
                    this.selectedNote.pitch = this.getCursorPitch(evt);
                }
                else if (this.dragMode == 'start') {
                    if (newDragBeat < this.selectedNote.end) {
                        const noteEnd = this.selectedNote.end;
                        this.selectedNote.start = newDragBeat;
                        this.selectedNote.end = noteEnd;
                    }
                }
                else if (this.dragMode == 'end') {
                    if (newDragBeat > this.selectedNote.start)
                        this.selectedNote.duration = newDragBeat - this.selectedNote.start;
                }
            }
        },
        onMouseUp(evt) {
            this.dragMode = null;
            this.dragOffset = 0;
            if (this.clip && this.selectedNote && this.selectedNote.duration == 0)
                this.clip.notes = this.clip.notes.filter(x => x !== this.selectedNote);
            this.selectedNote = null;
        },

        removeNote(evt) {
            if (!this.clip)
                return;
            const beat = this.getCursorBeat(evt);
            const pitch = this.getCursorPitch(evt);
            const note = this.clipNotes.find(x => x.pitch == pitch && x.contains(beat));
            if (note) {
                if (!this.canDeleteNote(note))
                    return;
                this.clip.notes = this.clip.notes.filter(x => x !== note);
                evt.preventDefault();
            }
            this.selectedNote = null;
            this.dragMode = null;
            this.dragOffset = 0;
        },

        addNewNote(evt, pitch) {
            const beat = this.getSnappedCursorBeat(evt);
            let noteDuration = 1 / this.safeDivisionsPerBeat;
            if (beat + noteDuration > this.clipDuration)
                noteDuration = this.clipDuration - beat;
            const clipNote = new ClipNote(beat, noteDuration, pitch, 80);
            if (!this.canAddNote(clipNote))
                return;
            this.clip.notes.push(clipNote);
            this.selectedNote = clipNote;
            this.dragMode = 'end';
            this.dragOffset = 0;
        },
        beginNoteDrag(mouseBeat) {
            if (!this.canEditNote(this.selectedNote))
                return;
            const noteWidth = this.selectedNote.duration * this.beatWidth;
            const startXDiff = (mouseBeat - this.selectedNote.start) * this.beatWidth;
            const endXDiff = (this.selectedNote.end - mouseBeat) * this.beatWidth;
            let dragMode = 'full';
            if (noteWidth < 20) {
                if (startXDiff * 4 < noteWidth)
                    dragMode = 'start';
                else if (endXDiff * 4 < noteWidth)
                    dragMode = 'end';
            }
            else {
                if (startXDiff <= 5)
                    dragMode = 'start';
                else if (endXDiff <= 5)
                    dragMode = 'end';
            }
            this.dragMode = dragMode;
            if (dragMode == 'end')
                this.dragOffset = this.selectedNote.end - mouseBeat;
            else
                this.dragOffset = this.selectedNote.start - mouseBeat;
        }
    }
}
</script>


<style>
.sh-clip-scroller {
    overflow: auto;
    max-height: 100%;
    position: relative;
}

.sh-clip-pianobar {
    width:40px;
    position: absolute;
}

.sh-clip-white-key {
    background-color: lightgray;
}

.sh-clip-white-key > label {
    font-family: sans-serif;
    font-size: 8px;
}

.sh-clip-black-key {
    background-color: #222;
}

.sh-clip-black-key > label {
    font-family: sans-serif;
    font-size: 8px;
    color: white;
}

.sh-clip-edit-area {
    margin-left:40px;
}

.sh-clip-bar-line {
    stroke: #303030;
    stroke-width: 2;
    stroke-dasharray: 5,0;
}

.sh-clip-beat-line {
    stroke: #E0E0E0;
    stroke-width: 1;
    stroke-dasharray: 5,0;
}

.sh-clip-division-line {
    stroke: #A0A0A0;
    stroke-width: 1;
    stroke-dasharray: 2,5;
}

line.sh-clip-pitch-separator {
    stroke: gray;
    stroke-width: 1;
}

div.sh-clip-pitch-separator {
    border-top-color: gray;
    border-top-width: 1;
    border-top-style: solid;
    box-sizing: border-box;
}
</style>