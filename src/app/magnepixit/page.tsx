import AuthForm from "@/components/magnepixit/auth-form";

export const metadata = {
  title: "MagnePixIt | BeforeAftr",
  description: "MagnePixIt's very own photo upload and cropping tool.",
};

export default function MagnePixItPage() {
  return (
    <main className={`flex items-center justify-center h-dvh`}>
      <AuthForm />
    </main>
  );
}
