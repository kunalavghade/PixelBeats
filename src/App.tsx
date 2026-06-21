
import { Layout } from './components/Layout';
import { Dropzone } from './components/Dropzone';
import { Controls } from './components/Controls';
import { Progress } from './components/Progress';
import { Player } from './components/Player';

function App() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="text-center mb-10 z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 pixel-font text-white glow-text uppercase tracking-widest">
            Retro Audio Converter
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto font-medium">
            Turn any video's audio track into a nostalgic 8-bit chiptune masterpiece. 
            All processing happens securely in your browser using WebAssembly.
          </p>
        </div>

        <div className="w-full z-10 flex flex-col gap-4">
          <Dropzone />
          <Progress />
          <Controls />
          <Player />
        </div>
      </div>
    </Layout>
  );
}

export default App;
