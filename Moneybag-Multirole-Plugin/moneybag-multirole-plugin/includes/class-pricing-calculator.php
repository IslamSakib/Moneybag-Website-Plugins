<?php
if (!defined('ABSPATH')) {
    exit;
}

class MoneyBagPricingCalculator {
    
    private $pricing_data;
    
    public function __construct($pricing_data) {
        $this->pricing_data = $pricing_data;
    }
    
    public function calculate($criteria) {
        // Find matching rule based on criteria
        $matched_rule = $this->find_matching_rule($criteria);
        
        if (!$matched_rule) {
            // Use default pricing if no rule matches
            $pricing_key = $this->pricing_data['defaultPricing'] ?? 'flat_2_5';
            $documents_key = $this->pricing_data['defaultDocuments'] ?? 'standard';
        } else {
            $pricing_key = $matched_rule['pricing'];
            $documents_key = $matched_rule['documents'];
        }
        
        // Get pricing details
        $pricing = $this->pricing_data['sets']['pricing'][$pricing_key] ?? [];
        $documents = $this->pricing_data['sets']['documents'][$documents_key] ?? [];
        
        // Prepare response
        $result = [
            'pricing' => $pricing,
            'documents' => $documents,
            'cardRate' => $pricing['cardRate'] ?? 'Contact us',
            'walletRate' => $pricing['walletRate'] ?? 'Contact us',
            'setupFee' => $pricing['setupFee'] ?? 'Contact us',
            'monthlyFee' => $pricing['monthlyFee'] ?? '0',
            'features' => $pricing['features'] ?? [],
            'negotiable' => $pricing['negotiable'] ?? false
        ];
        
        // Add special offer if available
        if (isset($matched_rule['specialOffer'])) {
            $result['specialOffer'] = $matched_rule['specialOffer'];
        }
        
        // Calculate estimated costs
        $result['estimatedMonthlyCost'] = $this->calculate_estimated_cost($criteria, $pricing);
        
        return $result;
    }
    
    private function find_matching_rule($criteria) {
        foreach ($this->pricing_data['rules'] as $rule) {
            if ($this->matches_conditions($criteria, $rule['conditions'])) {
                return $rule;
            }
        }
        
        return null;
    }
    
    private function matches_conditions($criteria, $conditions) {
        foreach ($conditions as $key => $value) {
            // Skip wildcard conditions
            if ($value === '*') {
                continue;
            }
            
            // Check if criteria matches condition
            if (!isset($criteria[$key]) || $criteria[$key] !== $value) {
                // Check for volume range matching
                if ($key === 'monthlyVolume' && isset($criteria[$key])) {
                    if ($this->matches_volume_range($criteria[$key], $value)) {
                        continue;
                    }
                }
                
                return false;
            }
        }
        
        return true;
    }
    
    private function matches_volume_range($actual, $expected) {
        // Parse volume ranges
        if (strpos($expected, '-') !== false) {
            list($min, $max) = explode('-', $expected);
            $min = intval(str_replace([',' , ' '], '', $min));
            $max = intval(str_replace([',' , ' '], '', $max));
            
            $actual_value = $this->parse_volume($actual);
            
            return $actual_value >= $min && $actual_value <= $max;
        } elseif (strpos($expected, '+') !== false) {
            $min = intval(str_replace(['+', ',', ' '], '', $expected));
            $actual_value = $this->parse_volume($actual);
            
            return $actual_value >= $min;
        }
        
        return $actual === $expected;
    }
    
    private function parse_volume($volume) {
        // Convert volume string to number
        if (strpos($volume, '-') !== false) {
            // Take the average of range
            list($min, $max) = explode('-', $volume);
            $min = intval(str_replace([',' , ' '], '', $min));
            $max = intval(str_replace([',' , ' '], '', $max));
            return ($min + $max) / 2;
        } elseif (strpos($volume, '+') !== false) {
            // Take the minimum value
            return intval(str_replace(['+', ',', ' '], '', $volume));
        }
        
        return intval(str_replace([',' , ' '], '', $volume));
    }
    
    private function calculate_estimated_cost($criteria, $pricing) {
        // Get monthly volume
        $monthly_volume = $this->parse_volume($criteria['monthlyVolume'] ?? '0');
        
        // Get rates
        $card_rate = $this->parse_rate($pricing['cardRate'] ?? '0');
        $wallet_rate = $this->parse_rate($pricing['walletRate'] ?? '0');
        $monthly_fee = intval(str_replace([',', ' ', 'BDT'], '', $pricing['monthlyFee'] ?? '0'));
        
        // Estimate transaction split (60% card, 40% wallet)
        $card_volume = $monthly_volume * 0.6;
        $wallet_volume = $monthly_volume * 0.4;
        
        // Calculate fees
        $card_fees = $card_volume * ($card_rate / 100);
        $wallet_fees = $wallet_volume * ($wallet_rate / 100);
        
        $total_estimated = $card_fees + $wallet_fees + $monthly_fee;
        
        return [
            'transactionFees' => round($card_fees + $wallet_fees),
            'monthlyFee' => $monthly_fee,
            'total' => round($total_estimated),
            'formatted' => number_format(round($total_estimated)) . ' BDT'
        ];
    }
    
    private function parse_rate($rate) {
        // Convert percentage string to number
        if (strpos($rate, '%') !== false) {
            return floatval(str_replace('%', '', $rate));
        }
        
        return 0;
    }
}