<?php
namespace Elementor;
if ( ! defined( 'ABSPATH' ) ) exit; // If this file is called directly, abort.
class R_Energy_Partners_Slider_Section_Widget extends Widget_Base {
    use R_Energy_Helper;
    public function get_name() {
        return 'r-energy-partners-slider-section';
    }
    public function get_title() {
        return 'Partners Slider';
    }
    public function get_icon() {
        return 'eicon-slider-push';
    }
    public function get_categories() {
        return [ 'r-energy' ];
    }
    // Registering Controls
    protected function register_controls() {
        /*****   START CONTROLS SECTION   ******/
        $this->start_controls_section( 'r_energy_partner_slider_settings',
            [
                'label' => esc_html__('Slider Content', 'r-energy'),
            ]
        );
        $this->add_control( 'type',
            [
                'label' => esc_html__( 'Type', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => esc_html__( 'Default', 'r-energy' ),
                    '1' => esc_html__( 'With Heading', 'r-energy' ),
                ]
            ]
        );
        $this->add_control( 'subtitle',
            [
                'label' => esc_html__( 'Subtitle', 'r-energy' ),
                'type' => Controls_Manager::TEXT,
                'default' => 'Partners',
                'label_block' => true,
                'condition' => ['type' => '1']
            ]
        );
        $this->add_control( 'title',
            [
                'label' => esc_html__( 'Title', 'r-energy' ),
                'type' => Controls_Manager::TEXTAREA,
                'default' => '<span>R-energy</span> <span>Brands</span>',
                'label_block' => true,
                'condition' => ['type' => '1']
            ]
        );
        $this->add_control( 'gallery',
            [
                'label' => esc_html__( 'Add Images', 'r-energy' ),
                'type' => Controls_Manager::GALLERY,
                'default' => ['url' => plugins_url( 'assets/front/img/brand-1.png', __DIR__ )],
            ]
        );
        $this->end_controls_section();
        /*****   END CONTROLS SECTION   ******/
        /*****   START CONTROLS SECTION   ******/
        $this->start_controls_section( 'brands_slider_options_section',
            [
                'label' => esc_html__( 'Slider Options', 'r-energy' ),
                'tab' => Controls_Manager::TAB_CONTENT
            ]
        );
        $this->add_control( 'autoplay',
            [
                'label' => esc_html__( 'Autoplay', 'r-energy' ),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'return_value' => 'yes',
            ]
        );
        $this->add_control( 'adaptiveHeight',
            [
                'label' => esc_html__( 'Adaptive Height', 'r-energy' ),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'return_value' => 'yes',
            ]
        );
        $this->add_control( 'infinite',
            [
                'label' => esc_html__( 'Infinite', 'r-energy' ),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'return_value' => 'yes',
            ]
        );
        $this->add_control( 'dots',
            [
                'label' => esc_html__( 'Dots', 'r-energy' ),
                'type' => Controls_Manager::SWITCHER,
                'default' => 'yes',
                'return_value' => 'yes',
            ]
        );
        $this->add_control( 'speed',
            [
                'label' => esc_html__( 'Speed', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 50,
                'max' => 5000,
                'default' => 300,
            ]
        );
        $this->add_control( 'slidesToShow',
            [
                'label' => esc_html__( 'Slides To Show', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 5,
            ]
        );
        $this->add_control( 'slidesToShow1200',
            [
                'label' => esc_html__( 'Slides To Show ( 1200px )', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 4,
            ]
        );
        $this->add_control( 'slidesToScroll1200',
            [
                'label' => esc_html__( 'Slides To Scroll ( 1200px )', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 2,
            ]
        );
        $this->add_control( 'slidesToShow992',
            [
                'label' => esc_html__( 'Slides To Show ( 992px )', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 3,
            ]
        );
        $this->add_control( 'slidesToScroll992',
            [
                'label' => esc_html__( 'Slides To Scroll ( 992px )', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 2,
            ]
        );
        $this->add_control( 'slidesToShow768',
            [
                'label' => esc_html__( 'Slides To Show ( 768px )', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 3,
            ]
        );
        $this->add_control( 'slidesToScroll768',
            [
                'label' => esc_html__( 'Slides To Scroll ( 768px )', 'r-energy' ),
                'type' => Controls_Manager::NUMBER,
                'min' => 1,
                'max' => 10,
                'default' => 2,
            ]
        );
        $this->end_controls_section();
        /*****   END CONTROLS SECTION   ******/
        /*****   START CONTROLS SECTION   ******/
        $this->start_controls_section( 'brands_text_options_section',
            [
                'label' => esc_html__( 'Section Text Options', 'r-energy' ),
                'tab' => Controls_Manager::TAB_CONTENT,
                'condition' => [ 'type' => '1' ],
            ]
        );
        $this->add_control( 'subtitle_heading',
            [
                'label' => esc_html__( 'Subtitle Options', 'r-energy' ),
                'type' => Controls_Manager::HEADING,
            ]
        );
        $this->add_control('subtitle_color',
            [
                'label' => esc_html__( 'Color', 'r-energy' ),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => ['{{WRAPPER}} .primary-heading .title'=> 'color: {{VALUE}};']
            ]
        );
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'subtitle_typo',
                'label' => esc_html__( 'Typography', 'r-energy' ),
                'selector' => '{{WRAPPER}} .primary-heading .title'
            ]
        );
        $this->add_control( 'title_heading',
            [
                'label' => esc_html__( 'Title Options', 'r-energy' ),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name' => 'title_typo',
                'label' => esc_html__( 'Typography', 'r-energy' ),
                'selector' => '{{WRAPPER}} .primary-heading .title'
            ]
        );
        $this->add_control('title_color',
            [
                'label' => esc_html__( 'Color', 'r-energy' ),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .primary-heading .subtitle span'=> 'color: {{VALUE}};',
                    '{{WRAPPER}} .primary-heading .subtitle::before'=> 'color: {{VALUE}};'
                ]
            ]
        );
        $this->add_control('title2_color',
            [
                'label' => esc_html__( 'Color 2', 'r-energy' ),
                'type' => Controls_Manager::COLOR,
                'default' => '',
                'selectors' => ['{{WRAPPER}} .primary-heading .subtitle span:last-of-type'=> 'color: {{VALUE}};']
            ]
        );
        $this->add_control( 'background_heading',
            [
                'label' => esc_html__( 'Background Options', 'r-energy' ),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
        );
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name' => 'brands_background',
                'label' => esc_html__( 'Background', 'r-energy' ),
                'types' => [ 'classic', 'gradient' ],
                'selector' => '{{WRAPPER}} .brands--with-heading',
                'separator' => 'before'
            ]
        );
        $this->add_responsive_control('brands_margin',
            [
                'label'         => esc_html__( 'Margin', 'r-energy' ),
                'type'          => Controls_Manager::DIMENSIONS,
                'size_units'    => [ 'px', 'em', '%' ],
                'selectors'     => ['{{WRAPPER}} .brands--with-heading' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'],
                'default'       => [
                    'top'          => '',
                    'right'        => '',
                    'bottom'       => '',
                    'left'         => '',
                ],
                'separator'     => 'before'
            ]
        );
        $this->end_controls_section();
        /*****   END CONTROLS SECTION   ******/
    }
    protected function render() {
        $settings  = $this->get_settings_for_display();
        $elementid = $this->get_id();
        $autoplay = 'yes' == $settings['autoplay'] ? 'true' : 'false';
        $adaptiveHeight = 'yes' == $settings['adaptiveHeight'] ? 'true' : 'false';
        $infinite = 'yes' == $settings['infinite'] ? 'true' : 'false';
        $dots = 'yes' == $settings['dots'] ? 'true' : 'false';
        $speed = $settings['speed'] ? $settings['speed'] : 300;
        $slidesToShow = $settings['slidesToShow'] ? $settings['slidesToShow'] : 5;
        $slidesToShow1200 = $settings['slidesToShow1200'] ? $settings['slidesToShow1200'] : 4;
        $slidesToScroll1200 = $settings['slidesToScroll1200'] ? $settings['slidesToScroll1200'] : 2;
        $slidesToShow992 = $settings['slidesToShow992'] ? $settings['slidesToShow992'] : 3;
        $slidesToScroll992 = $settings['slidesToScroll992'] ? $settings['slidesToScroll992'] : 2;
        $slidesToShow768 = $settings['slidesToShow768'] ? $settings['slidesToShow768'] : 2;
        $slidesToScroll768 = $settings['slidesToScroll768'] ? $settings['slidesToScroll768'] : 2;
        if ( $settings['type'] == '1' ) {
            echo '<div class="section brands brands--with-heading">';
                if ( $settings['subtitle'] || $settings['title'] ) {
                    echo '<div class="container">';
                        echo '<div class="row">';
                            echo '<div class="col-12">';
                                echo '<div class="heading primary-heading">';
                                    if ( $settings['subtitle'] ) {
                                        echo '<h3 class="title">'.$settings['subtitle'].'</h3>';
                                    }
                                    if ( $settings['title'] ) {
                                        echo '<h5 class="subtitle">'.$settings['title'].'</h5>';
                                    }
                                echo '</div>';
                            echo '</div>';
                        echo '</div>';
                    echo '</div>';
                }
                echo '<div class="container">';
                    echo '<div class="row">';
                        echo '<div class="col-12">';
                            echo '<div class="brands-holder">';
                                echo '<div class="brands-slider" data-slider-settings=\'{"autoplay":'.$autoplay.',"adaptiveHeight":'.$adaptiveHeight.',"infinite":'.$infinite.',"dots":'.$dots.',"speed":'.$speed.',"slidesToShow":'.$slidesToShow.',"slidesToShow1200":'.$slidesToShow1200.',"slidesToScroll1200":'.$slidesToScroll1200.',"slidesToShow992":'.$slidesToShow992.',"slidesToScroll992":'.$slidesToScroll992.',"slidesToShow768":'.$slidesToShow768.',"slidesToScroll768":'.$slidesToScroll768.'}\'>';
                                foreach ( $settings['gallery'] as $image ) {
                                    $imagealt = esc_attr(get_post_meta($image['id'], '_wp_attachment_image_alt', true));
                                    $imagealt = $imagealt ? $imagealt : basename ( get_attached_file( $image['id'] ) );
                                    echo '<div class="slider-item"><img src="' . $image['url'] . '" alt="'.$imagealt.'"/></div>';
                                }
                                echo '</div>';
                                echo '<div class="brands-dots"></div>';
                            echo '</div>';
                        echo '</div>';
                    echo '</div>';
                echo '</div>';
            echo '</div>';
        } else {
            echo '<div class="brands">';
                echo '<div class="brands-holder">';
                    echo '<div class="brands-slider" data-slider-settings=\'{"autoplay":'.$autoplay.',"adaptiveHeight":'.$adaptiveHeight.',"infinite":'.$infinite.',"dots":'.$dots.',"speed":'.$speed.',"slidesToShow":'.$slidesToShow.',"slidesToShow1200":'.$slidesToShow1200.',"slidesToScroll1200":'.$slidesToScroll1200.',"slidesToShow992":'.$slidesToShow992.',"slidesToScroll992":'.$slidesToScroll992.',"slidesToShow768":'.$slidesToShow768.',"slidesToScroll768":'.$slidesToScroll768.'}\'>';
                        foreach ( $settings['gallery'] as $image ) {
                            $imagealt = esc_attr(get_post_meta($image['id'], '_wp_attachment_image_alt', true));
                            $imagealt = $imagealt ? $imagealt : basename ( get_attached_file( $image['id'] ) );
                            echo '<div class="slider-item"><img src="' . $image['url'] . '" alt="'.$imagealt.'"/></div>';
                        }
                    echo '</div>';
                    echo '<div class="brands-dots"></div>';
                echo '</div>';
            echo '</div>';
        }
    }
}
