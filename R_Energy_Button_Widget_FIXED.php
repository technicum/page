<?php
namespace Elementor;
if ( ! defined( 'ABSPATH' ) ) exit; // If this file is called directly, abort.
class R_Energy_Button_Widget extends Widget_Base {
    use R_Energy_Helper;
    public function get_name() {
        return 'r-energy-button';
    }
    public function get_title() {
        return 'Button';
    }
    public function get_icon() {
        return 'eicon-button';
    }
    public function get_categories() {
        return [ 'r-energy' ];
    }
    // Registering Controls
    protected function register_controls() {
        /*****   Button Options   ******/
        $this->start_controls_section('r_energy_btn_settings',
            [
                'label' => esc_html__( 'Button', 'r-energy' ),
                'tab' => Controls_Manager::TAB_CONTENT,
            ]
        );
        $this->add_control( 'text',
            [
                'label' => esc_html__( 'Button Text', 'r-energy' ),
                'type' => Controls_Manager::TEXT,
                'label_block' => true,
                'default' => esc_html__( 'Button Text', 'r-energy' )
            ]
        );
        $this->add_control( 'link',
            [
                'label' => esc_html__( 'Button Link', 'r-energy' ),
                'type' => Controls_Manager::URL,
                'label_block' => true,
                'default' => [
                    'url' => '#',
                    'is_external' => ''
                ],
                'show_external' => true,
            ]
        );
        $this->add_control( 'type',
            [
                'label' => esc_html__( 'Button Type', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'default' => 'r-button--transparent',
                'options' => [
                    'r-button--transparent' => esc_html__( 'transparent', 'r-energy' ),
                    'r-button--filled' => esc_html__( 'filled', 'r-energy' ),
                    'simple' => esc_html__( 'Simple Text', 'r-energy' ),
                ]
            ]
        );
        $this->add_control( 'color',
            [
                'label' => esc_html__( 'Button Color Type', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'default' => 'r-button--primary',
                'options' => [
                    'r-button--primary' => esc_html__( 'primary', 'r-energy' ),
                    'r-button--primary r-button--dark' => esc_html__( 'dark', 'r-energy' ),
                    'r-button--primary r-button--gray' => esc_html__( 'gray', 'r-energy' ),
                    'r-button--black' => esc_html__( 'black', 'r-energy' ),
                ]
            ]
        );
        $this->add_control( 'size',
            [
                'label' => esc_html__( 'Size', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => esc_html__( 'Default', 'r-energy' ),
                    'r-button--md' => esc_html__( 'Medium', 'r-energy' ),
                    'r-button--sm' => esc_html__( 'Small', 'r-energy' ),
                    'r-button--xs' => esc_html__( 'Mini', 'r-energy' )
                ]
            ]
        );
        $this->add_control( 'style',
            [
                'label' => esc_html__( 'Button Style', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'default' => '',
                'options' => [
                    '' => esc_html__( 'Square', 'r-energy' ),
                    'r-button--rounded' => esc_html__( 'Circle', 'r-energy' ),
                    'r-button--radius' => esc_html__( 'Round', 'r-energy' )
                ]
            ]
        );
        $this->add_responsive_control( 'alignment',
            [
                'label' => esc_html__( 'Alignment', 'r-energy' ),
                'type' => Controls_Manager::CHOOSE,
                'selectors' => ['{{WRAPPER}} .r-energy-button:not(.btn-justify)' => 'text-align: {{VALUE}};'],
                'options' => [
                    'left' => [
                        'title' => esc_html__( 'Left', 'r-energy' ),
                        'icon' => 'fa fa-align-left'
                    ],
                    'center' => [
                        'title' => esc_html__( 'Center', 'r-energy' ),
                        'icon' => 'fa fa-align-center'
                    ],
                    'right' => [
                        'title' => esc_html__( 'Right', 'r-energy' ),
                        'icon' => 'fa fa-align-right'
                    ]
                ],
                'toggle' => true,
                'default' => 'left'
            ]
        );
        $this->add_control( 'use_icon',
            [
                'label' => esc_html__( 'Use Icon', 'r-energy' ),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => esc_html__( 'Yes', 'r-energy' ),
                'label_off' => esc_html__( 'No', 'r-energy' ),
                'return_value' => 'yes',
                'default' => 'no',
            ]
        );
        $this->add_control( 'icon',
            [
                'label' => esc_html__( 'Button Icon', 'r-energy' ),
                'type' => Controls_Manager::ICONS,
                'default' => [
                    'value' => '',
                    'library' => 'solid'
                ],
                'condition' => ['use_icon' => 'yes']
            ]
        );
        $this->add_control( 'icon_pos',
            [
                'label' => esc_html__( 'Icon Position', 'r-energy' ),
                'type' => Controls_Manager::SELECT,
                'default' => 'btn-icon-right',
                'options' => [
                    'btn-icon-left' => esc_html__( 'Before', 'r-energy' ),
                    'btn-icon-right' => esc_html__( 'After', 'r-energy' )
                ],
                'condition' => ['use_icon' => 'yes']
            ]
        );
        $this->add_control( 'icon_spacing',
            [
                'label' => esc_html__( 'Icon Spacing', 'r-energy' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'max' => 60
                    ]
                ],
                'selectors' => [
                    '{{WRAPPER}} .r-energy-button .btn-icon-left i' => 'margin-right: {{SIZE}}px;',
                    '{{WRAPPER}} .r-energy-button .btn-icon-right i' => 'margin-left: {{SIZE}}px;'
                ],
                'condition' => ['use_icon' => 'yes']
            ]
        );
        $this->add_control( 'full',
            [
                'label' => esc_html__( 'Full width', 'nt-addons' ),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => esc_html__( 'Yes', 'nt-addons' ),
                'label_off' => esc_html__( 'No', 'nt-addons' ),
                'return_value' => 'yes',
                'default' => 'no',
                'separator' => 'before'
            ]
        );
        $this->end_controls_section();
        /*****   End Button Options   ******/
        /***** Button Style ******/
        $this->start_controls_section('r_energy_btn_styling',
            [
                'label' => esc_html__( 'Button Style', 'r-energy' ),
                'tab' => Controls_Manager::TAB_STYLE
            ]
        );
        $this->start_controls_tabs('r_energy_btn_tabs');
        $this->start_controls_tab( 'r_energy_btn_normal_tab',
            [ 'label' => esc_html__( 'Normal', 'r-energy' ) ]
        );
            $this->add_control( 'btn_color',
                [
                    'label'         => esc_html__( 'Color', 'r-energy' ),
                    'type'          => Controls_Manager::COLOR,
                    'default'       => '',
                    'selectors'     => ['{{WRAPPER}} .r-energy-button .r-button span' => 'color: {{VALUE}};']
                ]
            );
            $this->add_group_control(
                Group_Control_Typography::get_type(),
                [
                    'name'          => 'btn_typo',
                    'label'         => esc_html__( 'Typography', 'r-energy' ),
                    'selector'      => '{{WRAPPER}} .r-energy-button .r-button span, {{WRAPPER}} .r-energy-button .r-button:before'
                ]
            );
            $this->add_responsive_control( 'btn_padding',
                [
                    'label'         => esc_html__( 'Padding', 'r-energy' ),
                    'type'          => Controls_Manager::DIMENSIONS,
                    'size_units'    => [ 'px' ],
                    'selectors'     => ['{{WRAPPER}} .r-energy-button .r-button span, {{WRAPPER}} .r-energy-button .r-button:before' => 'padding-top: {{TOP}}{{UNIT}};padding-bottom: {{BOTTOM}}{{UNIT}};'],
                    'allowed_dimensions'       => 'vertical',
                    'default'       => [
                        'top'          => '',
                        'right'        => '',
                        'bottom'       => '',
                        'left'         => '',
                    ],
                    'separator'     => 'before'
                ]
            );
            $this->add_group_control(
                Group_Control_Border::get_type(),
                [
                    'name'          => 'btn_border',
                    'label'         => esc_html__( 'Border', 'r-energy' ),
                    'selector'      => '{{WRAPPER}} .r-energy-button .r-button, {{WRAPPER}} .r-energy-button .r-button:before',
                    'separator'     => 'before'
                ]
            );
            $this->add_responsive_control( 'btn_border_radius',
                [
                    'label'         => esc_html__( 'Border Radius', 'r-energy' ),
                    'type'          => Controls_Manager::DIMENSIONS,
                    'size_units'    => [ 'px' ],
                    'selectors'     => ['{{WRAPPER}} .r-energy-button .r-button' => 'border-top-left-radius: {{TOP}}{{UNIT}};border-top-right-radius: {{RIGHT}}{{UNIT}};border-bottom-left-radius: {{BOTTOM}}{{UNIT}};border-bottom-right-radius: {{LEFT}}{{UNIT}};'],
                    'default'       => [
                        'top'          => '',
                        'right'        => '',
                        'bottom'       => '',
                        'left'         => '',
                    ],
                    'separator'     => 'before'
                ]
            );
            $this->add_group_control(
                Group_Control_Background::get_type(),
                [
                    'name'         => 'btn_background',
                    'label'        => esc_html__( 'Background', 'r-energy' ),
                    'types'        => [ 'classic', 'gradient' ],
                    'selector'     => '{{WRAPPER}} .r-energy-button .r-button span',
                    'separator'    => 'before'
                ]
            );
        $this->end_controls_tab();
        $this->start_controls_tab('r_energy_btn_hover_tab',
            [ 'label' => esc_html__( 'Hover', 'r-energy' ) ]
        );
         $this->add_control( 'btn_hvrcolor',
            [
                'label'         => esc_html__( 'Color', 'r-energy' ),
                'type'          => Controls_Manager::COLOR,
                'default'       => '',
                'selectors'     => ['{{WRAPPER}} .r-energy-button .r-button:before' => 'color: {{VALUE}};']
            ]
        );
        $this->add_group_control(
            Group_Control_Background::get_type(),
            [
                'name'         => 'btn_hvrbackground',
                'label'        => esc_html__( 'Background', 'r-energy' ),
                'types'        => [ 'classic', 'gradient' ],
                'selector'     => '{{WRAPPER}} .r-energy-button .r-button:before',
                'separator'    => 'before'
            ]
        );
        $this->end_controls_tab();
        $this->end_controls_tabs();
        $this->end_controls_section();
        /***** End Button Styling *****/
    }
    protected function render() {
        $settings = $this->get_settings_for_display();
        $type     = $settings['type'] ? ' '.$settings['type'] : '';
        $style    = $settings['style'] ? ' '.$settings['style'] : '';
        $color    = $settings['color'] ? ' '.$settings['color'] : '';
        $size     = $settings['size'] ? ' '.$settings['size'] : '';
        $iconpos  = !empty( $settings['icon']['value'] ) ? ' '.$settings['icon_pos'] : '';
        $target   = $settings['link']['is_external'] ? ' target="_blank"' : '';
        $nofollow = $settings['link']['nofollow'] ? ' rel="nofollow"' : '';
        $btnicon  = $settings['use_icon'] == 'yes' ? ' has-icon' : '';
        $full  = $settings['full'] == 'yes' ? ' w-100' : '';
        echo '<div class="r-energy-button'.$btnicon.$full.'">';
        if ( $settings['type'] == 'simple' ) {
            echo '<a class="with--line" href="'.$settings['link']['url'].'"'.$target.$nofollow.'><span>'.$settings['text'].'</span></a>';
        } else {
            if ( $settings['icon_pos'] == 'btn-icon-left' ) {
                echo '<a class="r-button'.$type.$color.$size.$style.$iconpos.$full.'" data-hover="'.$settings['text'].'" href="'.$settings['link']['url'].'"'.$target.$nofollow.'><span>'; if ( !empty( $settings['icon']['value'] ) ) { Icons_Manager::render_icon( $settings['icon'], [ 'aria-hidden' => 'true' ] ); } echo $settings['text'].'</span></a>';
            } else {
                echo '<a class="r-button'.$type.$color.$size.$style.$iconpos.$full.'" data-hover="'.$settings['text'].'" href="'.$settings['link']['url'].'"'.$target.$nofollow.'><span>'.$settings['text'].' ';
                if ( !empty( $settings['icon']['value'] ) ) { Icons_Manager::render_icon( $settings['icon'], [ 'aria-hidden' => 'true' ] ); } echo '</span></a>';}
            }
        echo '</div>';
    }
}
