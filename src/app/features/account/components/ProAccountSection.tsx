import { useState } from 'react';
import { Building2, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { NyraButton, NyraFormError, NyraInput, NyraLabel, NyraTextarea } from '@/app/components/form/NyraField';
import { proAccountErrorMessage, PRO_REQUEST_STATUS_LABELS } from '@/app/lib/proAccountMessages';
import type { ProAccountRequestStatus } from '@/app/services/api/authApi';

function StatusBanner({
  status,
  companyName,
  adminNote,
}: {
  status: ProAccountRequestStatus;
  companyName?: string;
  adminNote?: string | null;
}) {
  if (status === 'pending') {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Clock3 className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{PRO_REQUEST_STATUS_LABELS.pending}</p>
          <p className="mt-1 text-amber-800/90">
            Demande pour <span className="font-medium">{companyName}</span>. Notre équipe vous répondra après vérification.
          </p>
        </div>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <XCircle className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{PRO_REQUEST_STATUS_LABELS.rejected}</p>
          <p className="mt-1">Vous pouvez envoyer une nouvelle demande avec des informations complémentaires.</p>
          {adminNote ? <p className="mt-2 text-xs text-red-800/80">Note : {adminNote}</p> : null}
        </div>
      </div>
    );
  }
  return null;
}

export function ProAccountSection() {
  const user = useAuthStore((s) => s.user);
  const submitProRequest = useAuthStore((s) => s.submitProAccountRequest);

  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [companyPhone, setCompanyPhone] = useState(user?.phone ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const request = user.proAccountRequest;
  const canSubmitForm =
    !user.isProfessional && request?.status !== 'pending' && request?.status !== 'approved';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = companyName.trim();
    if (!name) {
      setError('La raison sociale est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      await submitProRequest({
        companyName: name,
        siret: siret.trim() || undefined,
        companyPhone: companyPhone.trim() || undefined,
        message: message.trim() || undefined,
      });
      setSubmitted(true);
      setCompanyName('');
      setSiret('');
      setMessage('');
    } catch (err) {
      setError(proAccountErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f2ea] text-[#7d755f]">
          <Building2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a] font-['Mulish',sans-serif]">Compte professionnel</h2>
          <p className="mt-1 text-sm text-gray-500 font-['Mulish',sans-serif]">
            Accédez aux tarifs grossiste et aux conditions réservées aux professionnels (herboristeries, boutiques, etc.).
          </p>
        </div>
      </div>

      {user.isProfessional ? (
        <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Compte professionnel actif</p>
            {user.proApprovedAt ? (
              <p className="mt-1 text-emerald-800/90">
                Activé le {new Date(user.proApprovedAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}.
              </p>
            ) : (
              <p className="mt-1 text-emerald-800/90">Vous bénéficiez des conditions professionnelles sur le catalogue.</p>
            )}
          </div>
        </div>
      ) : null}

      {!user.isProfessional && request ? (
        <div className="mt-5">
          <StatusBanner status={request.status} companyName={request.companyName} adminNote={request.adminNote} />
        </div>
      ) : null}

      {submitted && !user.isProfessional ? (
        <p className="mt-4 text-sm font-medium text-green-700 font-['Mulish',sans-serif]">
          Demande envoyée. Vous recevrez une confirmation après validation par notre équipe.
        </p>
      ) : null}

      {canSubmitForm ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <NyraLabel htmlFor="pro-company">Raison sociale *</NyraLabel>
            <NyraInput
              id="pro-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Herboristerie Dupont"
              autoComplete="organization"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <NyraLabel htmlFor="pro-siret">SIRET / NINEA (optionnel)</NyraLabel>
              <NyraInput
                id="pro-siret"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="12345678901234"
              />
            </div>
            <div>
              <NyraLabel htmlFor="pro-phone">Téléphone professionnel</NyraLabel>
              <NyraInput
                id="pro-phone"
                type="tel"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="+221 …"
                autoComplete="tel"
              />
            </div>
          </div>
          <div>
            <NyraLabel htmlFor="pro-message">Message (optionnel)</NyraLabel>
            <NyraTextarea
              id="pro-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Précisez votre activité ou vos besoins (volumes, catégories…)"
            />
          </div>
          <NyraFormError message={error} />
          <NyraButton type="submit" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
          </NyraButton>
        </form>
      ) : null}

      {!user.isProfessional && request?.status === 'pending' ? (
        <p className="mt-4 text-xs text-gray-500 font-['Mulish',sans-serif]">
          Une demande est déjà enregistrée. Vous ne pouvez pas en soumettre une autre tant qu’elle est en cours d’examen.
        </p>
      ) : null}
    </section>
  );
}
