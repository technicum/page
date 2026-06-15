<?php
namespace Elementor;
if ( ! defined( 'ABSPATH' ) ) exit; // If this file is called directly, abort.
class R_Energy_Page_Hero_Widget extends Widget_Base {
    use R_Energy_Helper;
    public function get_name() {
        return 'r-energy-page-hero-section';
    }
    public function get_title() {
        return 'Page Hero';
    }
    public function get_icon() {
        return 'eicon-columns';
    }
    public function get_categories() {
        return [ 'r-energy' ];
    }
    // Registering Controls
    protected function register_controls() {
        /*****   START CONTROLS SECTION   ******/
        $this->start_controls_section( 'r_energy_page_hero_settings',
            [
                'label' => esc_html__( 'Text', 'r-energy' ),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        $this->add_control( 'hero_type',
            [
                'label' => esc_html__( 'Hero Type', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'label_block' => 'true',
                'default' => 'promo-primary',
                'options' => [
                    'promo-primary' => esc_html__( 'Default', 'r-energy' ),
                    'promo-primary promo-primary--shop' => esc_html__( 'Shop type', 'r-energy' )
                ]
            ]
        );
        $this->add_control( 'subtitle_type',
            [
                'label' => esc_html__( 'Subtitle Type', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'label_block' => 'true',
                'default' => 'sitename',
                'options' => [
                    'sitename' => esc_html__( 'Site Name', 'r-energy' ),
                    'custom' => esc_html__( 'Custom Text', 'r-energy' ),
                    'none' => esc_html__( 'None', 'r-energy' ),
                ]
            ]
        );
        $this->add_control( 'subtitle',
            [
                'label' => esc_html__( 'Subtitle', 'r-energy' ),
                'type' => Controls_Manager::TEXT,
                'default' => 'R-Energy.',
                'label_block' => true,
                'condition' => [ 'subtitle_type' => 'custom' ]
            ]
        );
        $this->add_control( 'title_type',
            [
                'label' => esc_html__( 'Title Type', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'label_block' => 'true',
                'default' => 'page',
                'options' => [
                    'page' => esc_html__( 'Page Title', 'r-energy' ),
                    'custom' => esc_html__( 'Custom Text', 'r-energy' ),
                    'none' => esc_html__( 'None', 'r-energy' ),
                ]
            ]
        );
        $this->add_control( 'title',
            [
                'label' => esc_html__( 'Title', 'r-energy' ),
                'type' => Controls_Manager::TEXTAREA,
                'default' => get_the_title(),
                'label_block' => true,
                'condition' => [ 'title_type' => 'custom' ],
            ]
        );
        $this->add_control( 'breadcrumbs',
            [
                'label' => esc_html__( 'Breadcrumbs', 'r-energy' ),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => esc_html__( 'Show', 'r-energy' ),
				'label_off' => esc_html__( 'Hide', 'r-energy' ),
				'return_value' => 'yes',
				'default' => 'yes',
            ]
        );
        $this->add_control( 'bg_img',
            [
                'label' => esc_html__( 'Hero Image', 'r-energy' ),
                'type' => Controls_Manager::MEDIA,
                'default' => ['url' => plugins_url( 'assets/front/img/about.jpg', __DIR__ )],
            ]
        );
        $this->add_group_control(
            Group_Control_Image_Size::get_type(),
            [
                'name' => 'thumbnail',
                'default' => 'full',
                'condition' => [ 'bg_img[url]!' => '' ],
            ]
        );
        $this->end_controls_section();
        /*****   END CONTROLS SECTION   ******/
        /***** ABOUT TITLE ******/
        $this->start_controls_section('r_energy_pagehero_title_styling',
            [
                'label' => esc_html__( 'Page Hero Style', 'r_energy' ),
                'tab' => Controls_Manager::TAB_STYLE
            ]
        );
        $this->add_control( 'container_heading',
            [
                'label'         => esc_html__( 'CONTAINER', 'r-energy' ),
                'type'          => Controls_Manager::HEADING,
            ]
        );
        $this->add_control( 'overlay_color',
            [
                'label'         => esc_html__( 'Overlay Color', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .promo-primary .overlay' => 'background-color: {{VALUE}};']
            ]
        );
        $this->add_responsive_control( 'container_height',
            [
                'label' => esc_html__( 'Height', 'r-energy' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => [ 'px', 'vh' ],
                'range' => [
                    'px' => [
                        'min' => 0,
                        'max' => 1000,
                        'step' => 5,
                    ],
                    'vh' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => ['{{WRAPPER}} .promo-primary .align-container' => 'height: {{SIZE}}{{UNIT}};'],
            ]
        );
        $this->add_responsive_control( 'container_padding',
            [
                'label'         => esc_html__( 'Padding', 'r-energy' ),
                'type'          => Controls_Manager::DIMENSIONS,
                'size_units'    => [ 'px' ],
                'selectors'     => ['{{WRAPPER}} .promo-primary .align-container' => 'padding-top: {{TOP}}{{UNIT}};padding-right: {{RIGHT}}{{UNIT}};padding-bottom: {{BOTTOM}}{{UNIT}};padding-left: {{LEFT}}{{UNIT}};'],
                'default'       => [
                    'top'          => '',
                    'right'        => '',
                    'bottom'       => '',
                    'left'         => '',
                ],
            ]
        );
        $this->add_control( 'subtitle_heading',
            [
                'label'         => esc_html__( 'SUBTITLE', 'r-energy' ),
                'type'          => Controls_Manager::HEADING,
            ]
        );
        $this->add_control( 'subtitle_color',
            [
                'label'         => esc_html__( 'Color', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .promo-primary .site__name' => 'color: {{VALUE}};']
            ]
        );
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'          => 'subtitle_typo',
                'label'         => esc_html__( 'Typography', 'r-energy' ),
                'selector'      => '{{WRAPPER}} .promo-primary .site__name'
            ]
        );
        $this->add_responsive_control( 'subtitle_padding',
            [
                'label'         => esc_html__( 'Padding', 'r-energy' ),
                'type'          => Controls_Manager::DIMENSIONS,
                'size_units'    => [ 'px' ],
                'selectors'     => ['{{WRAPPER}} .promo-primary .site__name' => 'padding-top: {{TOP}}{{UNIT}};padding-right: {{RIGHT}}{{UNIT}};padding-bottom: {{BOTTOM}}{{UNIT}};padding-left: {{LEFT}}{{UNIT}};'],
                'default'       => [
                    'top'          => '',
                    'right'        => '',
                    'bottom'       => '',
                    'left'         => '',
                ],
            ]
        );
        $this->add_control( 'title_heading',
            [
                'label'         => esc_html__( 'TITLE', 'r-energy' ),
                'type'          => Controls_Manager::HEADING,
                'separator'       => 'before',
            ]
        );
        $this->add_control( 'title_color',
            [
                'label'         => esc_html__( 'Color', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .promo-primary .title' => 'color: {{VALUE}};']
            ]
        );
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'          => 'title_typo',
                'label'         => esc_html__( 'Typography', 'r-energy' ),
                'selector'      => '{{WRAPPER}} .promo-primary .title'
            ]
        );
        $this->add_responsive_control( 'title_padding',
            [
                'label'         => esc_html__( 'Padding', 'r-energy' ),
                'type'          => Controls_Manager::DIMENSIONS,
                'size_units'    => [ 'px' ],
                'selectors'     => ['{{WRAPPER}} .promo-primary .title' => 'padding-top: {{TOP}}{{UNIT}};padding-right: {{RIGHT}}{{UNIT}};padding-bottom: {{BOTTOM}}{{UNIT}};padding-left: {{LEFT}}{{UNIT}};'],
                'default'       => [
                    'top'          => '',
                    'right'        => '',
                    'bottom'       => '',
                    'left'         => '',
                ],
            ]
        );
        $this->add_control( 'title_linecolor1',
            [
                'label'         => esc_html__( 'Line Color 1', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .promo-primary .title::before' => 'background-color: {{VALUE}};']
            ]
        );
        $this->add_control( 'title_linecolor2',
            [
                'label'         => esc_html__( 'Line Color 2', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .promo-primary .title::after' => 'background-color: {{VALUE}};']
            ]
        );
        $this->add_responsive_control( 'title_line_height',
            [
                'label' => esc_html__( 'Line Height', 'r-energy' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'max' => 100
                    ]
                ],
                'selectors' => ['{{WRAPPER}} .promo-primary .title::before,{{WRAPPER}} .promo-primary .title::after' => 'height: {{SIZE}}px;'],
            ]
        );
        $this->add_responsive_control( 'title_line_position',
            [
                'label' => esc_html__( 'Line Bottom Position', 'r-energy' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => -300,
                        'max' => 300
                    ]
                ],
                'selectors' => ['{{WRAPPER}} .promo-primary .title::before,{{WRAPPER}} .promo-primary .title::after' => 'bottom: {{SIZE}}px;'],
            ]
        );
        $this->add_control( 'bread_heading',
            [
                'label'         => esc_html__( 'BREADCRUMBS', 'r-energy' ),
                'type'          => Controls_Manager::HEADING,
                'separator'       => 'before',
            ]
        );
        $this->add_group_control(
            Group_Control_Typography::get_type(),
            [
                'name'          => 'bread_typo',
                'label'         => esc_html__( 'Typography', 'r-energy' ),
                'selector'      => '{{WRAPPER}} .nt-breadcrumbs .nt-breadcrumbs-list li'
            ]
        );
        $this->add_control( 'bread_color',
            [
                'label'         => esc_html__( 'General Color', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .nt-breadcrumbs .nt-breadcrumbs-list li' => 'color: {{VALUE}};']
            ]
        );
        $this->add_control( 'bread_link_color',
            [
                'label'         => esc_html__( 'Link Color', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .nt-breadcrumbs .nt-breadcrumbs-list .breadcrumbs__link span' => 'color: {{VALUE}};']
            ]
        );
        $this->add_control( 'bread_link_hvrcolor',
            [
                'label'         => esc_html__( 'Link Color ( Hover )', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .nt-breadcrumbs .nt-breadcrumbs-list .breadcrumbs__link:hover span' => 'color: {{VALUE}};']
            ]
        );
        $this->add_responsive_control( 'bread_padding',
            [
                'label'         => esc_html__( 'Padding', 'r-energy' ),
                'type'          => Controls_Manager::DIMENSIONS,
                'size_units'    => [ 'px' ],
                'selectors'     => ['{{WRAPPER}} .nt-breadcrumbs' => 'padding-top: {{TOP}}{{UNIT}};padding-right: {{RIGHT}}{{UNIT}};padding-bottom: {{BOTTOM}}{{UNIT}};padding-left: {{LEFT}}{{UNIT}};'],
                'default'       => [
                    'top'          => '',
                    'right'        => '',
                    'bottom'       => '',
                    'left'         => '',
                ],
            ]
        );
        $this->add_responsive_control( 'bread_margin',
            [
                'label'         => esc_html__( 'Margin', 'r-energy' ),
                'type'          => Controls_Manager::DIMENSIONS,
                'size_units'    => [ 'px' ],
                'selectors'     => ['{{WRAPPER}} .nt-breadcrumbs' => 'margin-top: {{TOP}}{{UNIT}};margin-right: {{RIGHT}}{{UNIT}};margin-bottom: {{BOTTOM}}{{UNIT}};margin-left: {{LEFT}}{{UNIT}};'],
                'default'       => [
                    'top'          => '',
                    'right'        => '',
                    'bottom'       => '',
                    'left'         => '',
                ],
            ]
        );
        $this->end_controls_section();
        /***** END ABOUT TITLE ******/
    }
    protected function render() {
        $settings   = $this->get_settings_for_display();
        $elementid  = $this->get_id();
        $image      = $this->get_settings( 'bg_img' );
        $image_url  = Group_Control_Image_Size::get_attachment_image_src( $image['id'], 'thumbnail', $settings );
        $imagealt   = esc_attr(get_post_meta($image['id'], '_wp_attachment_image_alt', true));
        $imagealt   = $imagealt ? $imagealt : basename ( get_attached_file( $image['id'] ) );
        $imageurl   = empty( $image_url ) ? $image['url'] : $image_url;
        $imageurl   = empty( $image_url ) ? $image['url'] : $image_url;
        echo '<div class="'.$settings['hero_type'].'">';
            if ( $imageurl ) {
                echo '<div class="overlay"></div>';
                echo '<picture>';
                    echo '<source srcset="'.$imageurl.'" media="(min-width: 992px)"/>';
                    echo '<img class="img-bg" src="'.$imageurl.'" alt="'.$imagealt.'"/>';
                echo '</picture>';
            }
            echo '<div class="container">';
                echo '<div class="row">';
                    echo '<div class="col-12">';
                        echo '<div class="align-container">';
                            echo '<div class="align-item">';
                                if ( $settings['subtitle_type'] == 'custom' ) {
                                    if ( $settings['subtitle'] ) {
                                        echo '<span class="site__name">'.$settings['subtitle'].'</span>';
                                    }
                                }
                                if ( $settings['subtitle_type'] == 'sitename' ) {
                                    echo '<span class="site__name">'.get_bloginfo('name').'</span>';
                                }
                                if ( $settings['title_type'] == 'custom' ) {
                                    if ( $settings['title'] ) {
                                        echo '<h1 class="title">'.$settings['title'].'</h1>';
                                    }
                                }
                                if ( $settings['title_type'] == 'page' ) {
                                    echo '<h1 class="title">'.get_the_title().'</h1>';
                                }
                                if ( $settings['breadcrumbs'] == 'yes' ) {
                                    r_energy_breadcrumbs();
                                }
                            echo '</div>';
                        echo '</div>';
                    echo '</div>';
                echo '</div>';
            echo '</div>';
        echo '</div>';
    }
}
