// services/pregnancy-safety.ts — Dynamic pregnancy safety filtering and risk assessment
import nigerianDrugsDatabase from '@/data/nigerian-drugs-database.json';

export interface PregnancyProfile {
  isPregnant: boolean;
  weekNumber?: number;
  trimester?: 'first' | 'second' | 'third';
  dueDate?: Date;
  riskFactors?: string[];
  allergies?: string[];
  medicalConditions?: string[];
}

export interface SafetyAssessment {
  isRecommended: boolean;
  safetyCategory: 'A' | 'B' | 'C' | 'D' | 'X' | 'N' | 'UNKNOWN';
  riskLevel: 'SAFE' | 'CAUTION' | 'AVOID' | 'CONTRAINDICATED';
  trimesterRisks: {
    first: 'SAFE' | 'CAUTION' | 'AVOID' | 'CONTRAINDICATED';
    second: 'SAFE' | 'CAUTION' | 'AVOID' | 'CONTRAINDICATED';
    third: 'SAFE' | 'CAUTION' | 'AVOID' | 'CONTRAINDICATED';
  };
  warnings: string[];
  recommendations: string[];
  alternatives?: string[];
  doctorConsultRequired: boolean;
  emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE';
  description: string;
  management: string;
  pregnancySpecific?: boolean;
}

export class PregnancySafetyFilter {
  private pregnancyProfile: PregnancyProfile | null = null;
  private currentMedications: string[] = [];
  
  // FDA Pregnancy Categories
  private readonly categoryDefinitions = {
    'A': 'Controlled studies show no risk',
    'B': 'No evidence of risk in humans',
    'C': 'Risk cannot be ruled out',
    'D': 'Positive evidence of risk',
    'X': 'Contraindicated in pregnancy',
    'N': 'Not classified'
  };

  // Nigerian-specific safety guidelines
  private readonly nigerianGuidelines = {
    malariaTreatment: {
      recommended: ['Artemether-Lumefantrine', 'Sulfadoxine-Pyrimethamine'],
      avoid: ['Doxycycline', 'Quinine in first trimester'],
      alternatives: ['ACT combinations', 'IPTp-SP for prevention']
    },
    commonConditions: {
      fever: ['Paracetamol', 'Tepid sponging'],
      headache: ['Paracetamol', 'Rest in quiet environment'],
      nausea: ['Ginger', 'Vitamin B6', 'Small frequent meals'],
      infection: ['Amoxicillin', 'Erythromycin', 'Avoid fluoroquinolones']
    },
    traditionalRemedies: {
      caution: ['Bitter leaf (Vernonia amygdalina)', 'Scent leaf (Ocimum gratissimum)'],
      avoid: ['Tobacco leaves', 'Alcohol-based preparations'],
      safe: ['Ginger', 'Zobo (Hibiscus)', 'Cucumber']
    }
  };

  // Set user pregnancy profile
  public setPregnancyProfile(profile: PregnancyProfile) {
    this.pregnancyProfile = profile;
    
    // Auto-calculate trimester if week number provided
    if (profile.weekNumber) {
      if (profile.weekNumber <= 12) profile.trimester = 'first';
      else if (profile.weekNumber <= 27) profile.trimester = 'second';
      else profile.trimester = 'third';
    }
    
    // Save to storage for persistence
    try {
      localStorage.setItem('olive_pregnancy_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save pregnancy profile:', error);
    }
  }

  // Load pregnancy profile from storage
  public loadPregnancyProfile(): PregnancyProfile | null {
    try {
      const saved = localStorage.getItem('olive_pregnancy_profile');
      if (saved) {
        this.pregnancyProfile = JSON.parse(saved);
        return this.pregnancyProfile;
      }
    } catch (error) {
      console.error('Failed to load pregnancy profile:', error);
    }
    return null;
  }

  // Assess drug safety for pregnant women
  public assessDrugSafety(drugName: string): SafetyAssessment {
    const drug = this.findDrugInDatabase(drugName);
    
    if (!drug) {
      return this.createUnknownDrugAssessment(drugName);
    }

    const category = drug.pregnancy_category as SafetyAssessment['safetyCategory'];
    const riskLevel = this.determineRiskLevel(category);
    const trimesterRisks = this.assessTrimesterRisks(drug);
    const warnings = this.generateWarnings(drug, this.pregnancyProfile);
    const recommendations = this.generateRecommendations(drug);
    const alternatives = this.findAlternatives(drugName);

    return {
      isRecommended: riskLevel === 'SAFE',
      safetyCategory: category,
      riskLevel,
      trimesterRisks,
      warnings,
      recommendations,
      alternatives,
      doctorConsultRequired: ['C', 'D', 'X'].includes(category),
      emergencyLevel: category === 'X' ? 'CRITICAL' : 
                    category === 'D' ? 'HIGH' : 
                    category === 'C' ? 'MEDIUM' : 'LOW'
    };
  }

  // Find drug in Nigerian database
  private findDrugInDatabase(drugName: string) {
    const normalizedName = drugName.toLowerCase().trim();
    
    // Search by generic name, brand name, and common names
    return nigerianDrugsDatabase.find((drug: any) => 
      drug.generic_name.toLowerCase().includes(normalizedName) ||
      drug.name.toLowerCase().includes(normalizedName) ||
      drug.brand_names?.some((brand: string) => brand.toLowerCase().includes(normalizedName)) ||
      drug.common_names?.some((name: string) => name.toLowerCase().includes(normalizedName)) ||
      drug.pidgin_names?.some((name: string) => name.toLowerCase().includes(normalizedName))
    );
  }

  // Determine overall risk level from FDA category
  private determineRiskLevel(category: SafetyAssessment['safetyCategory']): SafetyAssessment['riskLevel'] {
    switch (category) {
      case 'A':
      case 'B':
        return 'SAFE';
      case 'C':
        return 'CAUTION';
      case 'D':
        return 'AVOID';
      case 'X':
        return 'CONTRAINDICATED';
      default:
        return 'CAUTION';
    }
  }

  // Assess risks by trimester
  private assessTrimesterRisks(drug: any): SafetyAssessment['trimesterRisks'] {
    const baseRisk = this.determineRiskLevel(drug.pregnancyCategory);
    
    // Some drugs have trimester-specific risks
    const trimesterSpecific = (drug as any).trimester_risks || {};
    
    return {
      first: trimesterSpecific.first || baseRisk,
      second: trimesterSpecific.second || baseRisk,
      third: trimesterSpecific.third || baseRisk
    };
  }

  // Generate contextual warnings
  private generateWarnings(drug: any, profile: PregnancyProfile | null): string[] {
    const warnings: string[] = [];
    
    if (!profile?.isPregnant) {
      warnings.push('Please update your pregnancy status for accurate safety assessment');
      return warnings;
    }

    // Category-specific warnings
    switch (drug.pregnancyCategory) {
      case 'X':
        warnings.push('⚠️ CONTRAINDICATED: This medication should never be used during pregnancy');
        warnings.push('🔴 May cause severe birth defects or pregnancy loss');
        break;
      case 'D':
        warnings.push('⚠️ HIGH RISK: Use only if benefits outweigh risks');
        warnings.push('🟡 Consult your doctor immediately before use');
        break;
      case 'C':
        warnings.push('⚠️ CAUTION: Animal studies show risk, limited human data');
        warnings.push('🟡 Discuss with your healthcare provider');
        break;
    }

    // Nigerian-specific warnings
    if (drug.nigerianWarnings) {
      warnings.push(...drug.nigerianWarnings);
    }

    // Trimester-specific warnings
    if (profile.trimester && (drug as any).trimester_risks) {
      const trimesterRisk = (drug as any).trimester_risks[profile.trimester];
      if (trimesterRisk === 'AVOID' || trimesterRisk === 'CONTRAINDICATED') {
        warnings.push(`⚠️ Particularly risky during ${profile.trimester} trimester`);
      }
    }

    // Drug interaction warnings
    const interactions = this.checkDrugInteractions(drug.genericName);
    if (interactions.length > 0) {
      warnings.push('⚠️ Potential drug interactions detected');
    }

    return warnings;
  }

  // Generate recommendations
  private generateRecommendations(drug: any): string[] {
    const recommendations: string[] = [];
    
    if (drug.safetyCategory === 'A' || drug.safetyCategory === 'B') {
      recommendations.push('✅ Generally considered safe during pregnancy');
      recommendations.push('💊 Take as prescribed by your healthcare provider');
    }
    
    if (drug.dosageAdjustments?.pregnancy) {
      recommendations.push(`💊 Dosage adjustment may be needed: ${drug.dosageAdjustments.pregnancy}`);
    }

    // Nigerian healthcare system recommendations
    recommendations.push('🏥 Ensure you\'re receiving antenatal care');
    recommendations.push('📱 Keep track of all medications in this app');
    
    if (drug.monitoring) {
      recommendations.push(`🔍 Regular monitoring required: ${drug.monitoring}`);
    }

    return recommendations;
  }

  // Find safer alternatives
  private findAlternatives(drugName: string): string[] {
    const alternatives: string[] = [];
    
    // Common alternatives mapping for Nigerian context
    const alternativesMap: Record<string, string[]> = {
      'aspirin': ['Paracetamol'],
      'ibuprofen': ['Paracetamol'],
      'ciprofloxacin': ['Amoxicillin', 'Erythromycin'],
      'doxycycline': ['Amoxicillin', 'Azithromycin'],
      'atenolol': ['Methyldopa', 'Labetalol'],
      'warfarin': ['Heparin (low molecular weight)'],
      'acei': ['Methyldopa', 'Calcium channel blockers']
    };

    const normalizedDrugName = drugName.toLowerCase();
    
    Object.keys(alternativesMap).forEach(key => {
      if (normalizedDrugName.includes(key)) {
        alternatives.push(...alternativesMap[key]);
      }
    });

    return alternatives;
  }

  // Check for drug interactions
  public checkDrugInteractions(newDrug: string): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];
    
    // Common pregnancy-specific drug interactions
    const pregnancyInteractions: DrugInteraction[] = [
      {
        drugA: 'warfarin',
        drugB: 'aspirin',
        severity: 'SEVERE',
        description: 'Increased bleeding risk, especially during pregnancy',
        management: 'Avoid combination. Use alternative anticoagulation.',
        pregnancySpecific: true
      },
      {
        drugA: 'iron',
        drugB: 'calcium',
        severity: 'MODERATE',
        description: 'Calcium reduces iron absorption',
        management: 'Take iron and calcium supplements at different times',
        pregnancySpecific: true
      }
    ];

    // Check against current medications
    this.currentMedications.forEach(currentMed => {
      pregnancyInteractions.forEach(interaction => {
        if (
          (interaction.drugA.toLowerCase().includes(newDrug.toLowerCase()) &&
           interaction.drugB.toLowerCase().includes(currentMed.toLowerCase())) ||
          (interaction.drugB.toLowerCase().includes(newDrug.toLowerCase()) &&
           interaction.drugA.toLowerCase().includes(currentMed.toLowerCase()))
        ) {
          interactions.push(interaction);
        }
      });
    });

    return interactions;
  }

  // Create assessment for unknown drugs
  private createUnknownDrugAssessment(drugName: string): SafetyAssessment {
    return {
      isRecommended: false,
      safetyCategory: 'UNKNOWN',
      riskLevel: 'CAUTION',
      trimesterRisks: {
        first: 'CAUTION',
        second: 'CAUTION',
        third: 'CAUTION'
      },
      warnings: [
        '⚠️ Drug not found in Nigerian pregnancy safety database',
        '🔍 Please consult your healthcare provider for safety information',
        '📞 Contact NAFDAC for drug verification if needed'
      ],
      recommendations: [
        '🏥 Consult your doctor before use',
        '📝 Verify drug registration with NAFDAC',
        '💊 Consider documented safe alternatives'
      ],
      doctorConsultRequired: true,
      emergencyLevel: 'MEDIUM'
    };
  }

  // Get comprehensive safety report
  public getComprehensiveSafetyReport(medications: string[]): {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assessments: Array<{ drug: string; assessment: SafetyAssessment }>;
    interactions: DrugInteraction[];
    recommendations: string[];
  } {
    this.currentMedications = medications;
    
    const assessments = medications.map(drug => ({
      drug,
      assessment: this.assessDrugSafety(drug)
    }));

    // Determine overall risk
    const highestRisk = assessments.reduce((max, current) => {
      const riskLevels = { 'SAFE': 0, 'CAUTION': 1, 'AVOID': 2, 'CONTRAINDICATED': 3 };
      return riskLevels[current.assessment.riskLevel] > riskLevels[max] ? current.assessment.riskLevel : max;
    }, 'SAFE' as SafetyAssessment['riskLevel']);

    const overallRisk = highestRisk === 'CONTRAINDICATED' ? 'CRITICAL' :
                       highestRisk === 'AVOID' ? 'HIGH' :
                       highestRisk === 'CAUTION' ? 'MEDIUM' : 'LOW';

    // Check all drug interactions
    const interactions: DrugInteraction[] = [];
    medications.forEach(drug => {
      interactions.push(...this.checkDrugInteractions(drug));
    });

    // Generate comprehensive recommendations
    const recommendations = this.generateComprehensiveRecommendations(assessments, overallRisk);

    return {
      overallRisk,
      assessments,
      interactions,
      recommendations
    };
  }

  // Generate comprehensive recommendations
  private generateComprehensiveRecommendations(
    assessments: Array<{ drug: string; assessment: SafetyAssessment }>,
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string[] {
    const recommendations: string[] = [];

    if (overallRisk === 'CRITICAL') {
      recommendations.push('🚨 URGENT: Stop using contraindicated medications immediately');
      recommendations.push('📞 Contact your doctor or emergency services now');
    } else if (overallRisk === 'HIGH') {
      recommendations.push('⚠️ Schedule immediate appointment with your healthcare provider');
      recommendations.push('📋 Review all medications with your doctor');
    }

    recommendations.push('💊 Always inform healthcare providers that you are pregnant');
    recommendations.push('📱 Use this app to track all medications and supplements');
    recommendations.push('🏥 Attend all scheduled antenatal appointments');
    
    if (this.pregnancyProfile?.trimester === 'first') {
      recommendations.push('🌟 First trimester is critical for fetal development - extra caution needed');
    }

    return recommendations;
  }

  // Update current medications
  public updateCurrentMedications(medications: string[]) {
    this.currentMedications = medications;
  }

  // Get pregnancy week from profile
  public getCurrentPregnancyWeek(): number | null {
    return this.pregnancyProfile?.weekNumber || null;
  }

  // Check if user is in high-risk trimester for specific drug
  public isHighRiskPeriod(drugName: string): boolean {
    if (!this.pregnancyProfile?.trimester) return false;
    
    const drug = this.findDrugInDatabase(drugName);
    if (!drug?.trimester_risks) return false;
    
    const currentTrimesterRisk = (drug as any).trimester_risks[this.pregnancyProfile.trimester];
    return currentTrimesterRisk === 'AVOID' || currentTrimesterRisk === 'CONTRAINDICATED';
  }
}

// Create global pregnancy safety filter instance
export const pregnancySafetyFilter = new PregnancySafetyFilter();