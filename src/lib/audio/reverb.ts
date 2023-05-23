import { Filter, Noise } from "./webaudio";

interface ReverbSettings {
    reverbTime: number;

}

export async function setupReverb(ctx: AudioContext, input: AudioNode, output: AudioNode, config: ReverbSettings) {
    const { reverbTime } = config;

    const effect = ctx.createConvolver();
    const wet = ctx.createGain();

    // Render tail
    const attack = 0.0001;
    const decay = 0.1;
    const release = reverbTime / 3;
    const preDelayValue = 0.03;

    const preDelay = ctx.createDelay(reverbTime);
    preDelay.delayTime.setValueAtTime(preDelayValue, ctx.currentTime);

    const multitap = [];
    for (let i = 2; i > 0; i --) {
        multitap.push(ctx.createDelay(reverbTime));
    }

    multitap.forEach((t, i, arr) => {
        if (arr[i + 1]) t.connect(arr[i + 1]);
        t.delayTime.setValueAtTime(0.001 + i * preDelayValue / 2, ctx.currentTime);
    });

    const multitapGain = ctx.createGain();
    multitapGain.gain.value = 0.2;

    input.connect(wet).connect(preDelay).connect(effect).connect(output);

    wet.connect(multitap[0]);
    multitap.at(-1)?.connect(multitapGain).connect(output);

    // Render tail

    const { renderedBuffer } = await new Promise<OfflineAudioCompletionEvent>((resolve) => {
        const tailContext = new OfflineAudioContext(2, ctx.sampleRate * reverbTime, ctx.sampleRate);
        tailContext.oncomplete = e => resolve(e);

        const tailOsc = new Noise(tailContext, 1);
        const tailLPFilter = new Filter(tailContext, "lowpass", 5000, 1);
        const tailHPFilter = new Filter(tailContext, "highpass", 500, 1);

        tailOsc.init();
        tailOsc.connect(tailHPFilter.input);
        tailHPFilter.connect(tailLPFilter.input);
        tailLPFilter.connect(tailContext.destination);
		tailOsc.attack = attack;
		tailOsc.decay = decay;
		tailOsc.release = release;

        tailContext.startRendering();
        tailOsc.on({ frequency: 500, velocity: 1 });

        setTimeout(() => {
            tailOsc.off();
        }, 1);
    });

    effect.buffer = renderedBuffer;


}

