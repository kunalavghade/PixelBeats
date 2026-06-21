import { Layout } from './components/Layout';
import { Dropzone } from './components/Dropzone';
import { Controls } from './components/Controls';
import { Progress } from './components/Progress';
import { Player } from './components/Player';

function App() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col gap-3 sm:gap-4">
        <Dropzone />
        <Progress />
        <Player />
        <Controls />
      </div>
    </Layout>
  );
}

export default App;
