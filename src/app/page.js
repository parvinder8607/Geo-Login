'use client';
import Image from "next/image";
import { useAuth } from '@/hooks/AuthContext';

export default function Home() {
  const { logout } = useAuth();
  return (
   <main>
    <section className="w-full h-screen flex flex-col justify-center items-center" >
      <h1 className="text-4xl font-bold">Hello User</h1>
      <p className="text-xl font-light text-gray-300 " >Welcome to my Geo-Login App!</p>
    <button className="bg-red-500 text-white px-4 py-2 rounded-md my-4"  onClick={logout}>
              log out
            </button>

    </section>
   </main>  );
}
