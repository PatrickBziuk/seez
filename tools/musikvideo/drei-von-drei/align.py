"""Wortzeiten messen: song.mp3 -> words_raw.json (faster-whisper, Modell "turbo")."""
import json, subprocess
import numpy as np
from faster_whisper import WhisperModel

subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", "song.mp3", "-ac", "1", "-ar", "16000", "song16.wav"])
audio = np.frombuffer(open("song16.wav", "rb").read()[44:], dtype="int16").astype("float32") / 32768
model = WhisperModel("turbo", device="cpu", compute_type="int8", cpu_threads=4)
segs, _ = model.transcribe(audio, language="de", word_timestamps=True, vad_filter=False, beam_size=5,
                           initial_prompt="Drei von drei, ich will doch drei von drei, Arbeit, Freunde, Zeit für mich – und eine Ecke bleibt nicht frei.")
out = [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
json.dump(out, open("words_raw.json", "w"), ensure_ascii=False)
print(len(out), "Wörter")
