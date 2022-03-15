import * as React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MNISTApp } from "./MNISTBoard.js";
import { MNISTDigits } from "./MNISTDigits.js";

export default function App() {
  return (
    <BrowserRouter>
      <div>
        <h1>0xZKML: MNIST</h1>
          <nav style={{ borderBottom: 'solid 1px', paddingBottom: '1rem' }}>
            <Link to="/">Home</Link> |{' '}
            <Link to="mnist">Draw Digit</Link> |{' '}
            <Link to="selector">Select Digit</Link> |{' '}
            <Link to="model">Model Desc</Link> |{' '}
          </nav>
        <Outlet />
      </div>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/mnist" element={<MNISTApp />}/>
        <Route path="/selector" element={<Selector />}/>
        <Route path="/model" element={<ModelDesc />}/>
      </Routes>
    </BrowserRouter>
  );
}

// TODO: do we want to host the writeup here?
function Home() {
  return <h2>Home</h2>
}

// TODO: placeholder for now
function Selector() {
  return <h2>Select images to classify</h2>
}

// TODO: place this in its own JS file
function ModelDesc() {
  return (
      <div>
      <h2>Model Description</h2>
      <h3>Architecture</h3>
      [image of architecture]
      <h3>Model Hash</h3>
      [hash]
      <h3>Overview</h3>
      Describe which parts are done on the front end, which parts happen in circom
      </div>
  )
}
