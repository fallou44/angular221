import { Component, signal, computed, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Modèle d'une activité
export interface Activite {
  id: number;
  nom: string;
  type: 'SPORT' | 'HYDRATATION';
  valeur: number;
  date: string;
}

const STORAGE_KEY = 'fittrackpro_activites';
const OBJECTIF_CALORIES = 2000;
const SEUIL_EAU = 1500;
const SEUIL_CALORIES_FELICITATIONS = 500;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // Constantes exposées au template
  readonly objectif_calories = OBJECTIF_CALORIES;
  readonly seuil_eau = SEUIL_EAU;
  readonly today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── État principal (Signals) ──────────────────────────────────────────────
  activites = signal<Activite[]>([]);

  // Formulaire réactif
  nomActivite = '';
  typeActivite: 'SPORT' | 'HYDRATATION' = 'SPORT';
  valeurActivite: number | null = null;
  erreurFormulaire = '';

  // ── Valeurs dérivées (computed) ───────────────────────────────────────────
  totalCalories = computed(() =>
    this.activites()
      .filter(a => a.type === 'SPORT')
      .reduce((sum, a) => sum + a.valeur, 0)
  );

  totalEau = computed(() =>
    this.activites()
      .filter(a => a.type === 'HYDRATATION')
      .reduce((sum, a) => sum + a.valeur, 0)
  );

  bilanCalorique = computed(() =>
    OBJECTIF_CALORIES - this.totalCalories()
  );

  alerteDeshydratation = computed(() =>
    this.totalEau() < SEUIL_EAU
  );

  objectifAtteint = computed(() =>
    this.totalEau() >= SEUIL_EAU && this.totalCalories() > SEUIL_CALORIES_FELICITATIONS
  );

  pourcentageEau = computed(() =>
    Math.min(100, Math.round((this.totalEau() / SEUIL_EAU) * 100))
  );

  pourcentageCalories = computed(() =>
    Math.min(100, Math.round((this.totalCalories() / OBJECTIF_CALORIES) * 100))
  );

  // ── Persistance automatique via effect ───────────────────────────────────
  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activites()));
    });
  }

  ngOnInit(): void {
    const donneesSauvegardees = localStorage.getItem(STORAGE_KEY);
    if (donneesSauvegardees) {
      this.activites.set(JSON.parse(donneesSauvegardees));
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  ajouterActivite(): void {
    this.erreurFormulaire = '';

    if (!this.nomActivite.trim()) {
      this.erreurFormulaire = 'Le nom de l\'activité est requis.';
      return;
    }
    if (this.valeurActivite === null || this.valeurActivite <= 0) {
      this.erreurFormulaire = 'La valeur doit être un nombre positif.';
      return;
    }

    const nouvelleActivite: Activite = {
      id: Date.now(),
      nom: this.nomActivite.trim(),
      type: this.typeActivite,
      valeur: this.valeurActivite,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    this.activites.update(liste => [...liste, nouvelleActivite]);

    // Reset formulaire
    this.nomActivite = '';
    this.typeActivite = 'SPORT';
    this.valeurActivite = null;
  }

  supprimerActivite(id: number): void {
    this.activites.update(liste => liste.filter(a => a.id !== id));
  }

  reinitialiserJournee(): void {
    this.activites.set([]);
  }

  getUnite(type: 'SPORT' | 'HYDRATATION'): string {
    return type === 'SPORT' ? 'kcal' : 'ml';
  }
}
