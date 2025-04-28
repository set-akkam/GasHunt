"use client";
import { JSX, useState } from "react";

export default function Submit(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Fuel price submitted!");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold">Submit Fuel Price</h1>
      <form onSubmit={handleSubmit} className="mt-4">
        <input type="file" onChange={handleFileChange} className="border p-2 w-full" />
        <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
          Upload
        </button>
      </form>
    </div>
  );
}
