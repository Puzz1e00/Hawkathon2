/**
 * BloodLink AI Donor Matching System
 * Advanced donor matching algorithm using machine learning concepts
 */

class DonorMatchAI {
    constructor() {
        // Configurable weights for the donor scoring algorithm
        this.weights = {
            bloodTypeCompatibility: 0.35,
            locationProximity: 0.25,
            donationHistory: 0.15,
            availabilityScore: 0.15,
            healthMetrics: 0.10
        };
        
        // Blood type compatibility matrix
        this.bloodTypeCompatibility = {
            'O-': { canDonateTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], universalDonor: true },
            'O+': { canDonateTo: ['O+', 'A+', 'B+', 'AB+'], universalDonor: false },
            'A-': { canDonateTo: ['A-', 'A+', 'AB-', 'AB+'], universalDonor: false },
            'A+': { canDonateTo: ['A+', 'AB+'], universalDonor: false },
            'B-': { canDonateTo: ['B-', 'B+', 'AB-', 'AB+'], universalDonor: false },
            'B+': { canDonateTo: ['B+', 'AB+'], universalDonor: false },
            'AB-': { canDonateTo: ['AB-', 'AB+'], universalDonor: false },
            'AB+': { canDonateTo: ['AB+'], universalDonor: false, universalRecipient: true }
        };
    }
    
    /**
     * Find optimal donors for a given patient
     * @param {Object} patient - Patient details including blood type, location, urgency
     * @param {Array} donors - Array of potential donors
     * @param {Object} options - Additional matching options
     * @returns {Array} - Ranked list of matching donors
     */
    findOptimalDonors(patient, donors, options = {}) {
        // Default options
        const defaultOptions = {
            minMatchScore: 0.6,
            maxResults: 10,
            prioritizeUniversalDonors: patient.urgency === 'critical',
            considerRareBloodTypes: true,
            requiresDirectMatch: patient.urgency === 'critical' ? false : true
        };
        
        const matchOptions = { ...defaultOptions, ...options };
        
        // Filter donors by basic compatibility
        let compatibleDonors = this._filterCompatibleDonors(patient, donors, matchOptions);
        
        // Score each compatible donor
        let scoredDonors = this._scoreDonors(patient, compatibleDonors, matchOptions);
        
        // Apply ensemble ranking (combine multiple ranking methods)
        let rankedDonors = this._ensembleRanking(scoredDonors, patient, matchOptions);
        
        // Generate confidence score for each match
        rankedDonors = rankedDonors.map(donor => {
            return {
                ...donor,
                confidenceScore: this._calculateConfidenceScore(donor, patient)
            };
        });
        
        return rankedDonors.slice(0, matchOptions.maxResults);
    }
    
    /**
     * Filter donors by basic compatibility criteria
     * @private
     */
    _filterCompatibleDonors(patient, donors, options) {
        // Initial donor pool
        let compatibleDonors = [...donors];
        
        // Filter by blood type compatibility
        compatibleDonors = compatibleDonors.filter(donor => {
            // For critical cases, include universal donors (O-)
            if (options.prioritizeUniversalDonors && 
                donor.bloodGroup === 'O-') {
                return true;
            }
            
            // Regular blood type compatibility check
            if (this.bloodTypeCompatibility[donor.bloodGroup]?.canDonateTo.includes(patient.bloodType)) {
                return true;
            }
            
            return false;
        });
        
        // Filter by eligibility (last donation date)
        const currentDate = new Date();
        compatibleDonors = compatibleDonors.filter(donor => {
            if (!donor.lastDonation) return true;
            
            const lastDonationDate = new Date(donor.lastDonation);
            const daysSinceLastDonation = Math.floor((currentDate - lastDonationDate) / (1000 * 60 * 60 * 24));
            
            // Typical eligibility is 56 days (8 weeks) for whole blood
            return daysSinceLastDonation >= 56;
        });
        
        return compatibleDonors;
    }
    
    /**
     * Score donors based on multiple criteria
     * @private
     */
    _scoreDonors(patient, donors, options) {
        return donors.map(donor => {
            // Calculate individual scores
            const bloodTypeScore = this._calculateBloodTypeScore(donor.bloodGroup, patient.bloodType);
            const locationScore = this._calculateLocationScore(donor, patient);
            const historyScore = this._calculateHistoryScore(donor);
            const availabilityScore = this._calculateAvailabilityScore(donor);
            const healthScore = this._calculateHealthScore(donor);
            
            // Calculate weighted total score
            const totalScore = 
                (bloodTypeScore * this.weights.bloodTypeCompatibility) +
                (locationScore * this.weights.locationProximity) +
                (historyScore * this.weights.donationHistory) +
                (availabilityScore * this.weights.availabilityScore) +
                (healthScore * this.weights.healthMetrics);
            
            // Boost universal donors for critical cases
            let finalScore = totalScore;
            if (options.prioritizeUniversalDonors && 
                donor.bloodGroup === 'O-' && 
                patient.urgency === 'critical') {
                finalScore *= 1.2; // 20% boost
            }
            
            // Add scores to donor object for transparency
            return {
                ...donor,
                matchScore: parseFloat(finalScore.toFixed(2)),
                matchDetails: {
                    bloodTypeScore,
                    locationScore,
                    historyScore,
                    availabilityScore,
                    healthScore
                }
            };
        })
        .filter(donor => donor.matchScore >= options.minMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore);
    }
    
    /**
     * Calculate blood type compatibility score
     * @private
     */
    _calculateBloodTypeScore(donorBloodType, patientBloodType) {
        // Exact match gets highest score
        if (donorBloodType === patientBloodType) {
            return 1.0;
        }
        
        // Universal donor (O-) gets high score
        if (donorBloodType === 'O-') {
            return 0.95;
        }
        
        // Check compatibility
        if (this.bloodTypeCompatibility[donorBloodType]?.canDonateTo.includes(patientBloodType)) {
            // Compatible but not ideal
            return 0.85;
        }
        
        // Not compatible
        return 0;
    }
    
    /**
     * Calculate location proximity score
     * @private
     */
    _calculateLocationScore(donor, patient) {
        // Simple implementation - check if state matches
        if (!donor.state || !patient.state) {
            return 0.5; // Neutral score if location info missing
        }
        
        if (donor.state === patient.state) {
            return 1.0;
        }
        
        // Calculate reduced score for neighboring states
        // This would be more sophisticated in a real implementation
        // using distance calculation between coordinates
        return 0.7;
    }
    
    /**
     * Calculate donor history score based on reliability
     * @private
     */
    _calculateHistoryScore(donor) {
        if (!donor.donationHistory) {
            return 0.5; // Neutral score for new donors
        }
        
        // Score based on donation frequency and reliability
        const donationCount = donor.donationHistory.length || 0;
        
        if (donationCount >= 10) return 1.0;
        if (donationCount >= 5) return 0.9;
        if (donationCount >= 3) return 0.8;
        if (donationCount >= 1) return 0.7;
        
        return 0.5;
    }
    
    /**
     * Calculate availability score
     * @private
     */
    _calculateAvailabilityScore(donor) {
        // Check donor's availability
        if (!donor.availability) {
            return 0.5; // Default to neutral
        }
        
        // Immediate availability gets highest score
        if (donor.availability === 'immediate') {
            return 1.0;
        }
        
        // Score based on availability window
        switch (donor.availability) {
            case 'today': return 0.9;
            case '24hours': return 0.8;
            case 'this_week': return 0.7;
            case 'next_week': return 0.5;
            default: return 0.4;
        }
    }
    
    /**
     * Calculate health metrics score
     * @private
     */
    _calculateHealthScore(donor) {
        // Simple implementation - more complex in real system
        if (!donor.healthMetrics) {
            return 0.8; // Default to good
        }
        
        // Check hemoglobin levels and other metrics
        // Return normalized score between 0-1
        return 0.8; // Placeholder
    }
    
    /**
     * Apply ensemble ranking - combine multiple ranking methods
     * @private
     */
    _ensembleRanking(scoredDonors, patient, options) {
        // Already scored by the primary algorithm
        // Here we could add additional ranking methods and combine results
        
        // For example, we could implement:
        // 1. Collaborative filtering (similar patients' donor choices)
        // 2. Geographic clustering
        // 3. Time-based availability optimization
        
        return scoredDonors;
    }
    
    /**
     * Calculate confidence score for match
     * @private
     */
    _calculateConfidenceScore(donor, patient) {
        // Base confidence on match score and data completeness
        const dataCompletenessScore = this._calculateDataCompleteness(donor);
        
        // Combine match score with data completeness
        const rawConfidence = (donor.matchScore * 0.7) + (dataCompletenessScore * 0.3);
        
        // Scale to 0-100% and round to nearest percent
        return Math.round(rawConfidence * 100);
    }
    
    /**
     * Calculate data completeness score
     * @private
     */
    _calculateDataCompleteness(donor) {
        // Check key fields presence
        const requiredFields = [
            'name', 'bloodGroup', 'contact', 'address', 
            'state', 'gender', 'age'
        ];
        
        const optionalFields = [
            'lastDonation', 'donationHistory', 'healthMetrics',
            'availability', 'email'
        ];
        
        // Count required fields
        let requiredFieldsPresent = 0;
        requiredFields.forEach(field => {
            if (donor[field]) requiredFieldsPresent++;
        });
        
        // Count optional fields
        let optionalFieldsPresent = 0;
        optionalFields.forEach(field => {
            if (donor[field]) optionalFieldsPresent++;
        });
        
        // Calculate completeness score (required fields have higher weight)
        const requiredScore = requiredFieldsPresent / requiredFields.length;
        const optionalScore = optionalFieldsPresent / optionalFields.length;
        
        return (requiredScore * 0.8) + (optionalScore * 0.2);
    }
    
    /**
     * Generate recommendations for optimal donation matching
     * @param {Array} matchedDonors - Array of matched donors
     * @param {Object} patient - Patient details
     * @returns {Object} - Recommendations for donation procedures
     */
    generateRecommendations(matchedDonors, patient) {
        if (!matchedDonors || matchedDonors.length === 0) {
            return {
                success: false,
                message: "No compatible donors found",
                alternativeAction: "Consider broadening search criteria or checking nearby hospitals"
            };
        }
        
        // Get top donors
        const topDonors = matchedDonors.slice(0, 3);
        
        // Generate recommendations based on patient needs and donor availability
        const recommendations = {
            success: true,
            primaryRecommendation: this._getPrimaryRecommendation(topDonors[0], patient),
            backupOptions: topDonors.slice(1).map(donor => this._getBackupOption(donor, patient)),
            urgencyLevel: this._calculateUrgencyLevel(patient, matchedDonors),
            suggestedTimeline: this._getSuggestedTimeline(patient, topDonors[0]),
            additionalNotes: this._getAdditionalNotes(patient, matchedDonors)
        };
        
        return recommendations;
    }
    
    /**
     * Get primary recommendation
     * @private
     */
    _getPrimaryRecommendation(donor, patient) {
        return {
            donorId: donor.id,
            donorName: donor.name,
            bloodType: donor.bloodGroup,
            matchConfidence: donor.confidenceScore,
            estimatedResponseTime: this._estimateResponseTime(donor),
            contactPriority: this._calculateContactPriority(donor, patient)
        };
    }
    
    /**
     * Get backup option
     * @private
     */
    _getBackupOption(donor, patient) {
        return {
            donorId: donor.id,
            donorName: donor.name,
            bloodType: donor.bloodGroup,
            matchConfidence: donor.confidenceScore
        };
    }
    
    /**
     * Calculate urgency level
     * @private
     */
    _calculateUrgencyLevel(patient, matchedDonors) {
        // Implementation would depend on patient condition and donor availability
        return patient.urgency || "standard";
    }
    
    /**
     * Get suggested timeline
     * @private
     */
    _getSuggestedTimeline(patient, donor) {
        if (patient.urgency === 'critical') {
            return "Immediate";
        }
        
        if (patient.urgency === 'high') {
            return "Within 24 hours";
        }
        
        return "Within 3 days";
    }
    
    /**
     * Get additional notes
     * @private
     */
    _getAdditionalNotes(patient, matchedDonors) {
        const notes = [];
        
        // Check for special conditions
        if (patient.bloodType === 'AB-' || patient.bloodType === 'B-') {
            notes.push("Rare blood type: Consider consulting with regional blood bank");
        }
        
        if (patient.urgency === 'critical' && matchedDonors.length < 3) {
            notes.push("Limited donor options: Consider expanding search to neighboring areas");
        }
        
        return notes;
    }
    
    /**
     * Estimate response time
     * @private
     */
    _estimateResponseTime(donor) {
        if (!donor.availability) {
            return "Unknown";
        }
        
        switch (donor.availability) {
            case 'immediate': return "Under 1 hour";
            case 'today': return "1-3 hours";
            case '24hours': return "Within 24 hours";
            default: return "2-3 days";
        }
    }
    
    /**
     * Calculate contact priority
     * @private
     */
    _calculateContactPriority(donor, patient) {
        if (patient.urgency === 'critical') {
            return "Urgent - Call Immediately";
        }
        
        if (patient.urgency === 'high') {
            return "High - Call Today";
        }
        
        return "Standard - Email/Call";
    }
}

// Export the DonorMatchAI class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DonorMatchAI };
} else {
    // Make available in browser
    window.DonorMatchAI = DonorMatchAI;
} 