import vosk from "vosk";

vosk.setLogLevel(-1);

const MODEL_PATH =
    "./models/vosk-model-small-ru-0.22";

const model =
    new vosk.Model(MODEL_PATH);

console.log(
    `🧠 [VOSK] Russian model loaded`,
);

export const speechToText = (
    pcm48kStereo: Buffer,
): string => {
    let recognizer:
        | vosk.Recognizer
        | null = null;

    try {
        const pcm16kMono =
            convert48kStereoTo16kMono(
                pcm48kStereo,
            );

        console.log(
            `🧠 [VOSK] Input: ${pcm48kStereo.length} bytes`,
        );

        console.log(
            `🧠 [VOSK] Converted: ${pcm16kMono.length} bytes`,
        );

        if (
            pcm16kMono.length <
            3200
        ) {
            console.log(
                `🔇 [VOSK] Audio too short`,
            );

            return "";
        }

        recognizer =
            new vosk.Recognizer({
                model,
                sampleRate: 16000,
            });

        recognizer.setMaxAlternatives(
            0,
        );

        recognizer.setWords(
            false,
        );

        recognizer.acceptWaveform(
            pcm16kMono,
        );

        const result =
            recognizer.finalResult();

        console.log(
            `🔎 [VOSK] Raw result:`,
            result,
        );

        const parsed =
            typeof result === "string"
                ? JSON.parse(result)
                : result;

        const text =
            typeof parsed?.text ===
            "string"
                ? parsed.text
                    .toLowerCase()
                    .trim()
                : "";

        console.log(
            `📝 [VOSK] Result: "${text}"`,
        );

        return text;
    } catch (error) {
        console.error(
            `❌ [VOSK] Error:`,
            error,
        );

        return "";
    } finally {
        if (recognizer) {
            recognizer.free();
        }
    }
};

function convert48kStereoTo16kMono(
    input: Buffer,
): Buffer {
    const BYTES_PER_SAMPLE = 2;

    const CHANNELS = 2;

    const INPUT_SAMPLE_RATE = 48000;

    const OUTPUT_SAMPLE_RATE = 16000;

    const FRAME_SIZE =
        BYTES_PER_SAMPLE *
        CHANNELS;

    const inputFrames =
        Math.floor(
            input.length /
            FRAME_SIZE,
        );

    const samplesPerOutput =
        INPUT_SAMPLE_RATE /
        OUTPUT_SAMPLE_RATE;

    const outputFrames =
        Math.floor(
            inputFrames /
            samplesPerOutput,
        );

    const output = Buffer.alloc(
        outputFrames *
        BYTES_PER_SAMPLE,
    );

    for (
        let outputIndex = 0;
        outputIndex < outputFrames;
        outputIndex++
    ) {
        const startFrame =
            Math.floor(
                outputIndex *
                samplesPerOutput,
            );

        const endFrame =
            Math.min(
                startFrame +
                samplesPerOutput,
                inputFrames,
            );

        let sum = 0;

        let count = 0;

        for (
            let frame =
                startFrame;
            frame < endFrame;
            frame++
        ) {
            const offset =
                frame *
                FRAME_SIZE;

            const left =
                input.readInt16LE(
                    offset,
                );

            const right =
                input.readInt16LE(
                    offset +
                    BYTES_PER_SAMPLE,
                );

            // Stereo → mono
            const mono =
                (left + right) / 2;

            sum += mono;

            count++;
        }

        const value =
            count > 0
                ? Math.round(
                    sum / count,
                )
                : 0;

        const clamped =
            Math.max(
                -32768,
                Math.min(
                    32767,
                    value,
                ),
            );

        output.writeInt16LE(
            clamped,
            outputIndex *
            BYTES_PER_SAMPLE,
        );
    }

    return output;
}