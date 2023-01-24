import './App.css'
import TwitchLogin from './pages/TwitchLogin'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/twitch" element={<TwitchLogin />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
