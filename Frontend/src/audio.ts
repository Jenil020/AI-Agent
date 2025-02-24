import EVENT_BUS from "@/event";

// @ts-ignore
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext()

const gainNode = context.createGain()
gainNode.gain.value = 1
gainNode.connect(context.destination)

const queue: AudioBuffer[] = []
let playing = false

const playBase64 = (base64: string) => {
    const arrayBuffer = base64ToArrayBuffer(base64);
    playArrayBuffer(arrayBuffer)
}

const playArrayBuffer = (arrayBuffer: ArrayBuffer) => {
    context.decodeAudioData(arrayBuffer, (audioBuffer) => {
        // 成功解码后，在此处使用audioBuffer（AudioBuffer对象）
        play(audioBuffer)
    }, (error) => {
        console.error('Error decoding audio data:', error);
    });
}

const getSource = () => {
    const source = context.createBufferSource()
    source.connect(gainNode)
    source.onended = () => {
        playing = false
        if (queue.length > 0) {
            play(queue.shift())
        } else {
            EVENT_BUS.emit('talk_end')
        }
        source.disconnect()
    }
    return source
}

const play = (buffer: AudioBuffer) => {
    if (playing) {
        // queue.push(buffer)
    } else {
        const source = getSource()
        source.buffer = buffer
        source.start()
        EVENT_BUS.emit('talk_start')
        playing = true
    }
}

const stop = () => {
    // source.stop()
    playing = false
}

function base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}

export {
    playBase64, stop, playArrayBuffer
}