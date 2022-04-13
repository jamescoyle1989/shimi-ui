<template>
    <div class="sh-clip">
        <div ref="scroller" class="sh-clip-scroller">

            <!-- Left piano bar -->
            <div ref="pianoBar" class="sh-clip-pianobar">

                <div v-for="p of pitches" :key="p"
                    :class="pitchIsBlack(p) ? 'sh-clip-black-key' : 'sh-clip-white-key'"
                    style="height:10px;">

                    <label v-if="p % 12 == 0">C{{p / 12}}</label>
                </div>
            </div>

            <svg :viewBox="'0 0 ' + (clipDuration * 100) + ' 1280'"
                preserveAspectRatio="none" fill="#666666"
                ref="svgElement" class="sh-clip-edit-area"
                @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"
                @mouseleave="onMouseUp" @contextmenu="onRightClick"
                :width="clipDuration * 100" :height="1280">

                <rect x="0" y="0" :width="clipDuration * 100" height="1280" fill="#666"/>

                <rect v-for="p of blackPitches" :key="'p' + p"
                    x="0" :y="(127 - p) * 10" :width="clipDuration * 100" height="10" fill="#555"/>

                <line v-for="line of beatLines" :key="'b' + line.beat"
                    :x1="line.beat * 100" y1="-10"
                    :x2="line.beat * 100" y2="1290"
                    :class="line.class"/>

                <rect v-for="n of clipNotes" :key="n.id"
                    :x="n.start * 100" :y="(127 - n.pitch) * 10"
                    height="10" :width="n.duration * 100"
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
            return Array.from(Array(128).keys()).reverse();
        },
        blackPitches() {
            return this.pitches.filter(x => this.pitchIsBlack(x));
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
        }
    },
    methods: {
        pitchIsBlack(pitch) {
            const m = pitch % 12;
            return m == 1 || m == 3 || m == 6 || m == 8 || m == 10;
        },
        getNoteColor(clipNote) {
            return '#00FF00';
        },
        getCursorBeat(evt) {
            this.svgPoint.x = evt.clientX;
            this.svgPoint.y = evt.clientY;
            const cursorPoint = this.svgPoint.matrixTransform(this.$refs.svgElement.getScreenCTM().inverse());

            return Math.min(Math.max(0, cursorPoint.x / 100), this.clipDuration);
        },
        /** beatOffset is how many beats ahead of the point where the mouse is, is the point we actually want to be snapping to */
        getSnappedCursorBeat(evt, beatOffset = 0) {
            this.svgPoint.x = evt.clientX;
            this.svgPoint.y = evt.clientY;
            const cursorPoint = this.svgPoint.matrixTransform(this.$refs.svgElement.getScreenCTM().inverse());

            //How many graphical units there are from one beat division to the next
            const unitsPerDivision = 100 / this.safeDivisionsPerBeat;
            let diffFromDivision = safeMod(cursorPoint.x + (beatOffset * 100), unitsPerDivision);
            if (diffFromDivision > (unitsPerDivision / 2))
                diffFromDivision -= unitsPerDivision;
            if (Math.abs(diffFromDivision) <= 5)
                cursorPoint.x -= diffFromDivision;

            return Math.min(Math.max(0, (cursorPoint.x / 100) + beatOffset), this.clipDuration);
        },
        getCursorPitch(evt) {
            this.svgPoint.x = evt.clientX;
            this.svgPoint.y = evt.clientY;
            const cursorPoint = this.svgPoint.matrixTransform(this.$refs.svgElement.getScreenCTM().inverse());

            return Math.min(Math.max(0, Math.floor((1280 - cursorPoint.y) / 10)), 127);
        },

        onMouseDown(evt) {
            if (evt.button != 0 || !this.clip)
                return;
            
            const beat = this.getCursorBeat(evt);
            const pitch = this.getCursorPitch(evt);
            this.selectedNote = this.clipNotes.find(x => x.pitch == pitch && x.contains(beat));
            if (this.selectedNote)
                this.beginNoteDrag(beat);
            else
                this.addNewNote(evt, pitch)
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
        onRightClick(evt) {
            if (!this.clip)
                return;
            const beat = this.getCursorBeat(evt);
            const pitch = this.getCursorPitch(evt);
            const note = this.clipNotes.find(x => x.pitch == pitch && x.contains(beat));
            if (note)
                this.clip.notes = this.clip.notes.filter(x => x !== this.selectedNote);
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
            this.clip.notes.push(clipNote);
            this.selectedNote = clipNote;
            this.dragMode = 'end';
            this.dragOffset = 0;
        },
        beginNoteDrag(mouseBeat) {
            const noteWidth = this.selectedNote.duration * 100;
            const startXDiff = (mouseBeat - this.selectedNote.start) * 100;
            const endXDiff = (this.selectedNote.end - mouseBeat) * 100;
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


<style scoped>
.sh-clip {
    width: 1200px;
    height: 800px;
}

.sh-clip-scroller {
    overflow: auto;
    max-height: 94.5%;
    position: relative;
}

.sh-clip-pianobar {
    width:40px;
    position: absolute;
}

.sh-clip-white-key {
    background-color: #FF8888;
}

.sh-clip-white-key > label {
    font-family: sans-serif;
    font-size: 8px;
}

.sh-clip-black-key {
    background-color: #000000;
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
</style>