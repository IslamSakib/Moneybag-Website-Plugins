<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class MoneybagPricingFormWidget extends \Elementor\Widget_Base
{

    public function get_name()
    {
        return 'moneybag_pricing_form';
    }

    public function get_title()
    {
        return esc_html__('Moneybag Pricing Form', 'moneybag-form');
    }

    public function get_icon()
    {
        return 'eicon-form-horizontal';
    }

    public function get_categories()
    {
        return ['general'];
    }

    public function get_keywords()
    {
        return ['form', 'pricing', 'consultation', 'moneybag'];
    }

    protected function register_controls()
    {

        $this->start_controls_section(
            'content_section',
            [
                'label' => esc_html__('Content', 'moneybag-form'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'widget_title',
            [
                'label' => esc_html__('Widget Title', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'default' => esc_html__('Pricing & Requirements', 'moneybag-form'),
                'placeholder' => esc_html__('Type your title here', 'moneybag-form'),
            ]
        );

        $this->add_control(
            'description_text',
            [
                'label' => esc_html__('Description', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'default' => esc_html__('Share your business details for a customized Moneybag pricing quote and the exact documents needed to start accepting payments seamlessly.', 'moneybag-form'),
                'placeholder' => esc_html__('Type your description here', 'moneybag-form'),
            ]
        );

        $this->add_control(
            'enable_api',
            [
                'label' => esc_html__('Enable API Integration', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' => esc_html__('Yes', 'moneybag-form'),
                'label_off' => esc_html__('No', 'moneybag-form'),
                'return_value' => 'yes',
                'default' => 'no',
            ]
        );

        $this->add_control(
            'api_endpoint',
            [
                'label' => esc_html__('API Endpoint', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'placeholder' => esc_html__('https://api.example.com/consultation', 'moneybag-form'),
                'condition' => [
                    'enable_api' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => esc_html__('Style', 'moneybag-form'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => esc_html__('Primary Color', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#374151',
            ]
        );

        $this->add_control(
            'accent_color',
            [
                'label' => esc_html__('Accent Color', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#3B82F6',
            ]
        );

        $this->add_control(
            'background_color',
            [
                'label' => esc_html__('Background Color', 'moneybag-form'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#FEF8F9',
            ]
        );

        $this->end_controls_section();
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $widget_id = $this->get_id();

        // Safe get with defaults
        $widget_title = isset($settings['widget_title']) ? $settings['widget_title'] : 'Pricing & Requirements';
        $description_text = isset($settings['description_text']) ? $settings['description_text'] : 'Share your business details for a customized pricing quote.';
        $enable_api = isset($settings['enable_api']) ? $settings['enable_api'] : 'no';
        $api_endpoint = isset($settings['api_endpoint']) ? $settings['api_endpoint'] : '';
        $primary_color = isset($settings['primary_color']) ? $settings['primary_color'] : '#374151';
        $accent_color = isset($settings['accent_color']) ? $settings['accent_color'] : '#3B82F6';
        $background_color = isset($settings['background_color']) ? $settings['background_color'] : '#FEF8F9';
?>

        <!-- Loading indicator -->
        <div id="moneybag-loading-<?php echo esc_attr($widget_id); ?>" style="padding: 40px; text-align: center; background: <?php echo esc_attr($background_color); ?>;">
            <h3>Loading Moneybag Form...</h3>
            <p>Please wait while we initialize the React component.</p>
            <div style="margin: 20px 0;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid <?php echo esc_attr($primary_color); ?>; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
        </div>

        <!-- React container -->
        <div id="moneybag-form-<?php echo esc_attr($widget_id); ?>"
            class="moneybag-pricing-form-container"
            data-widget-title="<?php echo esc_attr($widget_title); ?>"
            data-description="<?php echo esc_attr($description_text); ?>"
            data-enable-api="<?php echo esc_attr($enable_api); ?>"
            data-api-endpoint="<?php echo esc_attr($api_endpoint); ?>"
            data-primary-color="<?php echo esc_attr($primary_color); ?>"
            data-accent-color="<?php echo esc_attr($accent_color); ?>"
            data-background-color="<?php echo esc_attr($background_color); ?>"
            style="display: none;">
            <!-- React component will be mounted here -->
        </div>

        <!-- Fallback if React fails -->
        <div id="moneybag-fallback-<?php echo esc_attr($widget_id); ?>" style="display: none; background: <?php echo esc_attr($background_color); ?>; padding: 40px; border-radius: 10px;">
            <h3 style="color: <?php echo esc_attr($primary_color); ?>;">React Loading Failed</h3>
            <p>The React component couldn't load. Here's a simple version:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <select style="width: 100%; padding: 10px; margin: 10px 0;">
                    <option>Educational Institute</option>
                    <option>Corporation</option>
                </select>
                <button style="background: <?php echo esc_attr($primary_color); ?>; color: white; padding: 10px 20px; border: none; border-radius: 5px;">Get Pricing</button>
            </div>
        </div>

        <style>
            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }
        </style>

        <script>
            (function() {
                const widgetId = '<?php echo esc_js($widget_id); ?>';
                const loadingDiv = document.getElementById('moneybag-loading-' + widgetId);
                const containerDiv = document.getElementById('moneybag-form-' + widgetId);
                const fallbackDiv = document.getElementById('moneybag-fallback-' + widgetId);

                console.log('=== MONEYBAG DEBUG START ===');
                console.log('Widget ID:', widgetId);
                console.log('Loading div:', loadingDiv);
                console.log('Container div:', containerDiv);
                console.log('Fallback div:', fallbackDiv);

                // Check if React is available
                function checkReact() {
                    console.log('Checking React availability...');
                    console.log('window.React:', typeof window.React);
                    console.log('window.ReactDOM:', typeof window.ReactDOM);
                    console.log('window.MoneybagPricingForm:', typeof window.MoneybagPricingForm);

                    if (typeof window.React !== 'undefined' &&
                        typeof window.ReactDOM !== 'undefined' &&
                        typeof window.MoneybagPricingForm !== 'undefined') {
                        console.log('✅ All React dependencies loaded!');
                        return true;
                    }
                    return false;
                }

                // Try to mount React component
                function mountReactComponent() {
                    try {
                        console.log('Attempting to mount React component...');

                        const container = containerDiv;
                        if (!container) {
                            throw new Error('Container not found');
                        }

                        // Hide loading, show container
                        loadingDiv.style.display = 'none';
                        container.style.display = 'block';

                        console.log('Creating React root...');
                        const root = ReactDOM.createRoot(container);

                        console.log('Rendering React component...');
                        root.render(React.createElement(window.MoneybagPricingForm, {
                            widgetTitle: container.dataset.widgetTitle,
                            description: container.dataset.description,
                            enableApi: container.dataset.enableApi === 'yes',
                            apiEndpoint: container.dataset.apiEndpoint,
                            primaryColor: container.dataset.primaryColor,
                            accentColor: container.dataset.accentColor,
                            backgroundColor: container.dataset.backgroundColor
                        }));

                        console.log('✅ React component mounted successfully!');
                        return true;
                    } catch (error) {
                        console.error('❌ React mount failed:', error);
                        return false;
                    }
                }

                // Show fallback
                function showFallback() {
                    console.log('Showing fallback interface...');
                    loadingDiv.style.display = 'none';
                    containerDiv.style.display = 'none';
                    fallbackDiv.style.display = 'block';
                }

                // Main initialization
                function initialize() {
                    console.log('Initializing Moneybag form...');

                    if (checkReact()) {
                        if (mountReactComponent()) {
                            console.log('✅ React version loaded successfully!');
                            return;
                        }
                    }

                    console.log('❌ React failed, using fallback...');
                    showFallback();
                }

                // Wait for everything to load
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                        setTimeout(initialize, 1000); // Give React CDN time to load
                    });
                } else {
                    setTimeout(initialize, 1000);
                }

                console.log('=== MONEYBAG DEBUG END ===');
            })();
        </script>

    <?php
    }

    protected function content_template()
    {
    ?>
        <div class="moneybag-pricing-form-container">
            <div style="padding: 40px; text-align: center; border: 2px dashed #ddd; background: #f9f9f9;">
                <h3>Moneybag Pricing Form</h3>
                <p>This is a preview. The interactive form will appear on the frontend.</p>
            </div>
        </div>
<?php
    }
}
