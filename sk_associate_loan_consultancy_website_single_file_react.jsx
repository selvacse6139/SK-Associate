import React, { useState, useRef } from "react";

// Single-file React component for SK Associate — Loan Consultancy
// Tailwind CSS utility classes are used for styling (assumes Tailwind is available in the project)

export default function SKAssociateWebsite() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", loanType: "Personal", amount: "", source: "Website" });
  const [calc, setCalc] = useState({ principal: 500000, annualRate: 10, years: 5, emi: null });
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Simple brand config — change colors / text here
  const brand = {
    name: "SK Associate",
    tagline: "Fast approvals • Honest advice • Best rates",
    phone: "+91 87608 54861",
    email: "info@skassociate.com",
    primary: "indigo-600",
  };

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleCalcChange(e) {
    const { name, value } = e.target;
    setCalc((c) => ({ ...c, [name]: Number(value) }));
  }

  function calculateEMI() {
    const P = Number(calc.principal);
    const r = Number(calc.annualRate) / 12 / 100;
    const n = Number(calc.years) * 12;
    if (n === 0) return;
    if (r === 0) {
      const emi = P / n;
      setCalc((c) => ({ ...c, emi: Number(emi.toFixed(2)) }));
      return;
    }
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setCalc((c) => ({ ...c, emi: Number(emi.toFixed(2)) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Attach optional document
    const file = fileRef.current?.files?.[0];

    try {
      setUploading(true);

      // Example: try to POST to /api/lead (replace with your real endpoint)
      // The endpoint should accept multipart/form-data when a file is included.
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append("document", file);

      // Fallback behaviour: if no backend available, open mail client with mailto
      const response = await fetch("/api/lead", { method: "POST", body: formData });

      if (!response.ok) {
        // fallback to mailto if server returns error
        throw new Error("Server error");
      }

      setSubmitted(true);
      setForm({ name: "", phone: "", email: "", message: "", loanType: "Personal", amount: "", source: "Website" });
      if (fileRef.current) fileRef.current.value = null;
    } catch (err) {
      // Fallback: prepare mailto link with basic details
      const subject = encodeURIComponent(`${brand.name} — Lead from website`);
      const body = encodeURIComponent(
        `Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}
Loan Type: ${form.loanType}
Amount: ${form.amount}
Message: ${form.message}`
      );
      window.location.href = `mailto:${brand.email}?subject=${subject}&body=${body}`;
      setError("Unable to submit to backend — opening email client as fallback.");
    } finally {
      setUploading(false);
      setTimeout(() => setSubmitted(false), 4000);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-pink-500 flex items-center justify-center text-white font-bold`}>{brand.name.split(" ").map(s=>s[0]).join("")}</div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold">{brand.name}</h1>
              <p className="text-xs text-gray-500">{brand.tagline}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="hover:underline">Services</a>
            <a href="#calculator" className="hover:underline">EMI Calculator</a>
            <a href="#about" className="hover:underline">About</a>
            <a href="#contact" className={`text-white bg-${brand.primary} px-4 py-2 rounded shadow`}>Contact</a>
          </div>

          <div className="md:hidden">
            <button className="px-3 py-2 border rounded">Menu</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Get the right loan at the best terms — fast.</h2>
            <p className="mt-4 text-gray-600">Personal loans • Home loans • Business loans • Balance transfers
              <br />We compare lenders, prepare documents, and negotiate rates — end-to-end support until disbursal.</p>

            <div className="mt-6 flex gap-3">
              <a href="#contact" className={`px-5 py-3 bg-${brand.primary} text-white rounded shadow`}>Request a call</a>
              <a href="#calculator" className="px-5 py-3 border rounded text-gray-700">Try EMI calculator</a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="bg-white p-4 rounded shadow-sm">
                <div className="font-semibold">₹10k+</div>
                <div className="text-xs">Approved amount</div>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <div className="font-semibold">99%+</div>
                <div className="text-xs">Documentation success</div>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <div className="font-semibold">100+</div>
                <div className="text-xs">Happy clients</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold">Quick Lead Form</h3>
            <p className="text-sm text-gray-600">Share a few details and an optional document — we'll reach you quickly.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input name="name" value={form.name} onChange={handleFormChange} required placeholder="Full name" className="w-full p-3 rounded border" />
                <input name="phone" value={form.phone} onChange={handleFormChange} required placeholder="Mobile number" className="w-full p-3 rounded border" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input name="email" value={form.email} onChange={handleFormChange} placeholder="Email (optional)" className="w-full p-3 rounded border" />
                <select name="loanType" value={form.loanType} onChange={handleFormChange} className="w-full p-3 rounded border">
                  <option>Personal</option>
                  <option>Home</option>
                  <option>Business</option>
                  <option>Balance Transfer</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input name="amount" value={form.amount} onChange={handleFormChange} placeholder="Loan Amount (₹)" className="w-full p-3 rounded border" />
                <input name="message" value={form.message} onChange={handleFormChange} placeholder="Short message" className="w-full p-3 rounded border" />
              </div>

              <div>
                <label className="text-sm">Upload supporting doc (ID / bank statement) — optional</label>
                <input ref={fileRef} type="file" accept="application/pdf,image/*" className="w-full mt-1" />
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={uploading} className={`px-4 py-2 bg-${brand.primary} text-white rounded`}>{uploading ? "Sending..." : "Submit"}</button>
                {submitted && <span className="text-sm text-green-600">Thanks — we'll call you soon.</span>}
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
            </form>

            <div className="mt-4 text-xs text-gray-500">We never share your data without consent. Read our privacy policy.</div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mt-12">
          <h3 className="text-2xl font-bold">Our Services</h3>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {[
              { title: "Home Loans", desc: "Low-rate home loans and balance transfers" },
              { title: "Personal Loans", desc: "Quick approvals with minimal documentation" },
              { title: "Business Loans", desc: "Working capital & term loans for SMEs" },
            ].map((s) => (
              <div key={s.title} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-lg font-semibold">{s.title}</div>
                <div className="mt-2 text-sm text-gray-600">{s.desc}</div>
                <div className="mt-4">
                  <a href="#contact" className="text-indigo-600 underline text-sm">Get advice</a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calculator & Why choose us */}
        <section id="calculator" className="mt-12 grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold">EMI Calculator</h3>
            <p className="text-sm text-gray-600 mt-2">Estimate monthly payments instantly.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm">Loan amount (₹)</label>
                <input type="number" name="principal" value={calc.principal} onChange={handleCalcChange} className="w-full p-3 rounded border mt-1" />
              </div>
              <div>
                <label className="text-sm">Annual interest rate (%)</label>
                <input type="number" name="annualRate" value={calc.annualRate} onChange={handleCalcChange} className="w-full p-3 rounded border mt-1" />
              </div>
              <div>
                <label className="text-sm">Tenure (years)</label>
                <input type="number" name="years" value={calc.years} onChange={handleCalcChange} className="w-full p-3 rounded border mt-1" />
              </div>

              <div className="flex gap-3 mt-3">
                <button onClick={calculateEMI} className={`px-4 py-2 bg-${brand.primary} text-white rounded`}>Calculate</button>
                <button onClick={() => setCalc({ ...calc, emi: null })} className="px-4 py-2 border rounded">Reset</button>
              </div>

              {calc.emi !== null && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Estimated monthly EMI</div>
                  <div className="text-2xl font-bold">₹{calc.emi}</div>
                  <div className="text-sm text-gray-600 mt-1">Total payment: ₹{(calc.emi * calc.years * 12).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold">Why choose us?</h3>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li>Personalised lender matching</li>
              <li>Paperwork support & documentation checks</li>
              <li>Rate negotiation & balance transfer advice</li>
              <li>End-to-end loan disbursal support</li>
            </ul>

            <div className="mt-6">
              <h4 className="font-semibold">Testimonials</h4>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <div className="p-3 bg-gray-50 rounded">"Quick service — got my home loan approved in 10 days." — A. Kumar</div>
                <div className="p-3 bg-gray-50 rounded">"Helpful team and clear guidance." — S. Mehta</div>
              </div>
            </div>
          </div>
        </section>

        {/* About & FAQ */}
        <section id="about" className="mt-12 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold">About {brand.name}</h3>
            <p className="mt-3 text-gray-600">We are a local consultancy that helps individuals and small businesses identify the most affordable loan options. Our team checks eligibility, prepares documentation, and supports you through disbursal.</p>

            <h4 className="mt-6 font-semibold">Quick facts</h4>
            <ul className="mt-2 text-gray-600">
              <li>Registered consultants</li>
              <li>Transparent fee structure</li>
              <li>Local offices & remote support</li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold">FAQ</h3>
            <div className="mt-4 space-y-3 text-gray-600">
              <details className="p-3 bg-white rounded border">
                <summary className="cursor-pointer font-medium">How long does approval take?</summary>
                <p className="mt-2 text-sm">Depends on the lender and documents — typically 3–15 business days.</p>
              </details>

              <details className="p-3 bg-white rounded border">
                <summary className="cursor-pointer font-medium">What documents are required?</summary>
                <p className="mt-2 text-sm">ID proof, address proof, income proof, bank statements. We provide a checklist when you sign up.</p>
              </details>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-12 bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg shadow-sm">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-2xl font-bold">Contact & Office</h3>
              <p className="mt-2 text-gray-600">Visit our office or send a message — we’ll get back in one business day.</p>

              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <div><strong>Phone:</strong> {brand.phone}</div>
                <div><strong>Email:</strong> <a href={`mailto:${brand.email}`} className="underline">{brand.email}</a></div>
                <div><strong>Address:</strong> Your local city — provide exact address</div>
              </div>

              <div className="mt-6 flex gap-3">
                <a href={`tel:${brand.phone}`} className={`px-4 py-2 bg-${brand.primary} text-white rounded`}>Call Us</a>
                <a href={`mailto:${brand.email}`} className="px-4 py-2 border rounded">Email</a>
              </div>
            </div>

            <div className="bg-white p-4 rounded">
              <form onSubmit={handleSubmit} className="space-y-3">
                <input name="name" value={form.name} onChange={handleFormChange} required placeholder="Full name" className="w-full p-3 rounded border" />
                <input name="phone" value={form.phone} onChange={handleFormChange} required placeholder="Mobile number" className="w-full p-3 rounded border" />
                <input name="email" value={form.email} onChange={handleFormChange} placeholder="Email" className="w-full p-3 rounded border" />
                <textarea name="message" value={form.message} onChange={handleFormChange} placeholder="Tell us about the loan you'd like" className="w-full p-3 rounded border" rows={3} />
                <div className="flex gap-3">
                  <button type="submit" className={`px-4 py-2 bg-${brand.primary} text-white rounded`}>Send message</button>
                  <button type="button" onClick={() => setForm({ name: "", phone: "", email: "", message: "", loanType: "Personal", amount: "", source: "Website" })} className="px-4 py-2 border rounded">Clear</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white mt-12 py-6">
        <div className="max-w-6xl mx-auto px-6 text-sm text-gray-600 flex flex-col md:flex-row justify-between gap-4">
          <div>© {new Date().getFullYear()} {brand.name}. All rights reserved.</div>
          <div className="flex gap-4">
            <a className="underline">Privacy</a>
            <a className="underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
