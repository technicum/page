<?php
namespace Elementor;
use Elementor\Controls_Manager;
use Elementor\Core\Base\Document;
use Elementor\Core\Base\Module as BaseModule;
use Elementor\Plugin;
use Elementor\Utils;
use Elementor\Core\DocumentTypes\PageBase as PageBase;
use Elementor\Modules\Library\Documents\Page as LibraryPageDocument;
if( !defined( 'ABSPATH' ) ) exit;
class R_Energy_Customizing_Page_Settings {
    private static $instance = null;
    public static function get_instance() {
        if ( null == self::$instance ) {
            self::$instance = new R_Energy_Customizing_Page_Settings();
        }
        return self::$instance;
    }
    public function __construct(){
        // custom option for elementor heading widget font size
        add_action( 'elementor/element/wp-post/document_settings/before_section_end',[ $this,'r_energy_add_custom_settings_to_page_settings'], 10);
        add_action( 'elementor/element/wp-page/document_settings/before_section_end',[ $this,'r_energy_add_custom_settings_to_page_settings'], 10);
        add_action( 'elementor/element/wp-page/section_page_style/after_section_end',[ $this,'r_energy_add_custom_settings_to_page_style_settings'], 10);
        add_filter( 'elementor/editor/localize_settings', [ $this,'r_energy_register_template'],10,2 );
    }
    public function r_energy_register_template($localized_settings,$config)
    {
        $localized_settings = [
            'i18n' => [
                'my_templates' => esc_html__( 'R-Energy Templates', 'r-energy' )
            ]
        ];
        return $localized_settings;
    }
    public function r_energy_add_custom_settings_to_page_settings( $page )
    {
        if(isset($page) && $page->get_id() > ""){
            $nt_post_type   = false;
            $nt_post_type   = get_post_type($page->get_id());
            if ( $nt_post_type == 'page' || $nt_post_type == 'revision' ) {
                $page->add_control( 'r_energy_hide_page_header',
                    [
                        'label'          => esc_html__( 'Hide Header', 'r-energy' ),
                        'type'           => Controls_Manager::SWITCHER,
                        'label_on'       => esc_html__( 'Yes', 'r-energy' ),
                        'label_off'      => esc_html__( 'No', 'r-energy' ),
                        'return_value'   => 'yes',
                        'default'        => 'no',
                        'condition'      => [ 'template'   => 'r-energy-elementor-page.php' ]
                    ]
                );
                $page->add_control( 'r_energy_page_header_type',
                    [
                        'label' => esc_html__( 'Header Type', 'r-energy' ),
                        'type' => Controls_Manager::SELECT,
                        'default' => '',
                        'options' => [
                            '' => esc_html__( 'Slect a type', 'r-energy' ),
                            'fullwidth' => esc_html__( 'Fullwidth', 'r-energy' ),
                            'boxed' => esc_html__( 'Boxed', 'r-energy' ),
                            'boxedbar' => esc_html__( 'Boxed + Bottom Bar', 'r-energy' ),
                            'shop' => esc_html__( 'Shop', 'r-energy' )
                        ],
                        'condition'      => [ 'template'   => 'r-energy-elementor-page.php' ]
                    ]
                );
                $page->add_control( 'r_energy_hide_page_footer_widgetize',
                    [
                        'label'          => esc_html__( 'Hide Footer Widgetize', 'r-energy' ),
                        'type'           => Controls_Manager::SWITCHER,
                        'label_on'       => esc_html__( 'Yes', 'r-energy' ),
                        'label_off'      => esc_html__( 'No', 'r-energy' ),
                        'return_value'   => 'yes',
                        'default'        => 'no',
                        'condition'      => [ 'template'   => 'r-energy-elementor-page.php' ]
                    ]
                );
                $page->add_control( 'r_energy_hide_page_footer',
                    [
                        'label'          => esc_html__( 'Hide Footer', 'r-energy' ),
                        'type'           => Controls_Manager::SWITCHER,
                        'label_on'       => esc_html__( 'Yes', 'r-energy' ),
                        'label_off'      => esc_html__( 'No', 'r-energy' ),
                        'return_value'   => 'yes',
                        'default'        => 'no',
                        'condition'      => [ 'template'   => 'r-energy-elementor-page.php' ]
                    ]
                );
            }
        }
    }
    public function r_energy_add_custom_settings_to_page_style_settings( $page )
    {
        if(isset($page) && $page->get_id() > ""){
            $nt_post_type = false;
            $nt_post_type = get_post_type($page->get_id());
            if ( $nt_post_type == 'page' || $nt_post_type == 'revision' ) {
                /***********************************************/
                /**************** STYLE OPTIONS ****************/
                /***********************************************/
                $page->start_controls_section( 'r_energy_page_header_style_controls_section',
                    [
                        'label'        => esc_html__( 'Page Header Style', 'r-energy' ),
                        'tab'          => Controls_Manager::TAB_STYLE,
                        'condition'    => [ 'r_energy_hide_page_header!'   => 'yes' ]
                    ]
                );
                $page->add_control( 'r_energy_page_header_background_heading',
                    [
                        'label'         => esc_html__( 'Background Style', 'r-energy' ),
                        'type'          => Controls_Manager::HEADING
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_header_height',
                    [
                        'label'         => esc_html__( 'Height', 'r-energy' ),
                        'type'          => Controls_Manager::SLIDER,
                        'range'         => [ 'px'   => [ 'max' => 300 ] ],
                        'selectors'     => [ '{{WRAPPER}} #main-header' => 'height: {{SIZE}}px!important;' ],
                        'separator'     => 'after'
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_header_padding',
                    [
                        'label'         => esc_html__( 'Padding', 'r-energy' ),
                        'type'          => Controls_Manager::DIMENSIONS,
                        'size_units'    => [ 'px', 'em', '%' ],
                        'selectors'     => ['{{WRAPPER}} #main-header' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}!important;'],
                        'default'       => [
                            'top'          => '',
                            'right'        => '',
                            'bottom'       => '',
                            'left'         => '',
                        ],
                        'separator'     => 'after'
                    ]
                );
                $page->add_group_control(
                    Group_Control_Background::get_type(),
                    [
                        'name'          => 'r_energy_page_header_background',
                        'label'         => esc_html__( 'Background', 'r-energy' ),
                        'types'         => [ 'classic', 'gradient' ],
                        'selector'      => '{{WRAPPER}} #main-header',
                        'separator'     => 'before'
                    ]
                );
                $page->add_control( 'r_energy_page_header_background_hr', [ 'type' => Controls_Manager::DIVIDER ] );
                $page->add_control( 'r_energy_page_header_menu_heading',
                    [
                        'label'         => esc_html__( 'Menu Style', 'r-energy' ),
                        'type'          => Controls_Manager::HEADING
                    ]
                );
                $page->add_group_control(
                    Group_Control_Typography::get_type(),
                    [
                        'name'          => 'r_energy_page_header_menu_typo',
                        'label'         => esc_html__( 'Typography', 'r-energy' ),
                        'selector'      => '{{WRAPPER}} .navbar-nav>li>a'
                    ]
                );
                $page->start_controls_tabs('r_energy_page_header_menu_normal_tabs');
                $page->start_controls_tab( 'r_energy_page_header_menu_normal_tab',
                    [ 'label'           => esc_html__( 'Normal', 'r-energy' ) ]
                );
                $page->add_control( 'r_energy_page_header_menu_normal_color',
                    [
                        'label'         => esc_html__( 'Menu Item Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => ['{{WRAPPER}} .navbar-nav>li>a' => 'color: {{VALUE}};']
                    ]
                );
                $page->end_controls_tab();
                $page->start_controls_tab('r_energy_page_header_menu_hover_tab',
                    [ 'label'           => esc_html__( 'Hover', 'r-energy' ) ]
                );
                $page->add_control( 'r_energy_page_header_menu_hover_color',
                    [
                        'label'         => esc_html__( 'Menu Item Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => [ '{{WRAPPER}} .main-nav li a:hover, .secondary-nav li a:hover' => 'color: {{VALUE}};' ]
                    ]
                );
                $page->end_controls_tab();
                $page->end_controls_tabs();
                $page->end_controls_section();
                $page->start_controls_section( 'r_energy_page_sticky_header_style_controls_section',
                    [
                        'label'         => esc_html__( 'Sticky Header Style', 'r-energy' ),
                        'tab'           => Controls_Manager::TAB_STYLE,
                        'condition'     => [
                            'r_energy_hide_page_header!'   => 'yes'
                        ]
                    ]
                );
                $page->add_control( 'r_energy_page_sticky_header_background_heading',
                    [
                        'label'         => esc_html__( 'Background Style', 'r-energy' ),
                        'type'          => Controls_Manager::HEADING
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_sticky_header_height',
                    [
                        'label'         => esc_html__( 'Height', 'r-energy' ),
                        'type'          => Controls_Manager::SLIDER,
                        'range'         => [ 'px'   => [ 'max' => 300 ] ],
                        'selectors'     => [ '{{WRAPPER}} #main-header.header-clone' => 'height: {{SIZE}}px!important;' ],
                        'separator'     => 'after'
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_sticky_header_padding',
                    [
                        'label'         => esc_html__( 'Padding', 'r-energy' ),
                        'type'          => Controls_Manager::DIMENSIONS,
                        'size_units'    => [ 'px', 'em', '%' ],
                        'selectors'     => [
                            '{{WRAPPER}} #main-header.header-clone' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}!important;',
                            '{{WRAPPER}} #main-header.header-clone .logo img' => 'position:relative;'
                        ],
                        'default'       => [
                            'top'          => '',
                            'right'        => '',
                            'bottom'       => '',
                            'left'         => '',
                        ],
                        'separator'     => 'after'
                    ]
                );
                $page->add_group_control(
                    Group_Control_Background::get_type(),
                    [
                        'name'          => 'r_energy_page_sticky_header_background',
                        'label'         => esc_html__( 'Background', 'r-energy' ),
                        'types'         => [ 'classic', 'gradient' ],
                        'selector'      => '{{WRAPPER}} #main-header.header-clone',
                        'separator'     => 'before'
                    ]
                );
                $page->add_control( 'r_energy_page_sticky_header_background_hr', [ 'type' => Controls_Manager::DIVIDER ] );
                $page->add_control( 'r_energy_page_sticky_header_menu_heading',
                    [
                        'label'         => esc_html__( 'Menu Style', 'r-energy' ),
                        'type'          => Controls_Manager::HEADING
                    ]
                );
                $page->add_group_control(
                    Group_Control_Typography::get_type(),
                    [
                        'name'          => 'r_energy_page_sticky_header_menu_typo',
                        'label'         => esc_html__( 'Typography', 'r-energy' ),
                        'selector'      => '{{WRAPPER}} .header-clone .navbar-nav>li>a'
                    ]
                );
                $page->start_controls_tabs('r_energy_page_sticky_header_menu_normal_tabs');
                $page->start_controls_tab( 'r_energy_page_sticky_header_menu_normal_tab',
                    [ 'label'           => esc_html__( 'Normal', 'r-energy' ) ]
                );
                $page->add_control( 'r_energy_page_sticky_header_menu_normal_color',
                    [
                        'label'         => esc_html__( 'Menu Item Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => [ '{{WRAPPER}} .header-clone .navbar-nav>li>a' => 'color: {{VALUE}};' ]
                    ]
                );
                $page->end_controls_tab();
                $page->start_controls_tab('r_energy_page_sticky_header_menu_hover_tab',
                    [ 'label'           => esc_html__( 'Hover', 'r-energy' ) ]
                );
                $page->add_control( 'r_energy_page_sticky_header_menu_hover_color',
                    [
                        'label'         => esc_html__( 'Menu Item Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => [ '{{WRAPPER}} .header-clone .navbar-nav>li>a:hover' => 'color: {{VALUE}};']
                    ]
                );
                $page->end_controls_tab();
                $page->end_controls_tabs();
                $page->end_controls_section();
                $page->start_controls_section( 'r_energy_page_header_mobile_style_controls_section',
                    [
                        'label'        => esc_html__( 'Page Header Mobile Style', 'r-energy' ),
                        'tab'          => Controls_Manager::TAB_STYLE,
                        'condition'    => [
                            'r_energy_hide_page_header!'   => 'yes',
                        ]
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_header_mobile_item_padding',
                    [
                        'label'         => esc_html__( 'Menu Item Padding', 'r-energy' ),
                        'type'          => Controls_Manager::DIMENSIONS,
                        'size_units'    => [ 'px', 'em', '%' ],
                        'selectors'     => [
                            '{{WRAPPER}} .navbar-collapse.collapse.in .navbar-nav>li' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}!important;'
                        ],
                        'default'       => [
                            'top'          => '',
                            'right'        => '',
                            'bottom'       => '',
                            'left'         => '',
                        ],
                        'separator'     => 'after'
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_header_mobile_item_margin',
                    [
                        'label'         => esc_html__( 'Menu Item Margin', 'r-energy' ),
                        'type'          => Controls_Manager::DIMENSIONS,
                        'size_units'    => [ 'px', 'em' ],
                        'selectors'     => [
                            '{{WRAPPER}} .navbar-collapse.collapse.in .navbar-nav>li' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}}!important;'
                        ],
                        'default'       => [
                            'top'          => '',
                            'right'        => '',
                            'bottom'       => '',
                            'left'         => '',
                        ],
                        'separator'     => 'after'
                    ]
                );
                $page->add_control( 'more_options',
                    [
                        'label'         => esc_html__( 'Toggle Menu Background', 'plugin-name' ),
                        'type'          => Controls_Manager::HEADING,
                        'separator'     => 'before',
                    ]
                );
                $page->add_group_control(
                    Group_Control_Background::get_type(),
                    [
                        'name'          => 'r_energy_page_header_mobile_inner_background',
                        'label'         => esc_html__( 'Toggle Menu Background', 'r-energy' ),
                        'types'         => [ 'classic', 'gradient' ],
                        'selector'      => '{{WRAPPER}} .navbar-collapse.collapsing, .navbar-collapse.collapse.in',
                    ]
                );
                $page->add_control( 'r_energy_page_header_mobile_inner_background_hr', [ 'type' => Controls_Manager::DIVIDER ] );
                $page->add_control( 'r_energy_page_header_mobile_menu_heading',
                    [
                        'label'         => esc_html__( 'Menu Style', 'r-energy' ),
                        'type'          => Controls_Manager::HEADING
                    ]
                );
                $page->add_group_control(
                    Group_Control_Typography::get_type(),
                    [
                        'name'          => 'r_energy_page_header_mobile_menu_typo',
                        'label'         => esc_html__( 'Typography', 'r-energy' ),
                        'selector'      => '{{WRAPPER}} .navbar-collapse.collapse.in .navbar-nav>li>a'
                    ]
                );
                $page->start_controls_tabs('r_energy_page_header_mobile_menu_normal_tabs');
                $page->start_controls_tab( 'r_energy_page_header_mobile_menu_normal_tab',
                    [ 'label'           => esc_html__( 'Normal', 'r-energy' ) ]
                );
                $page->add_control( 'r_energy_r_energy_page_header_mobile_menu_bar_color',
                    [
                        'label'         => esc_html__( 'Menu Bar Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => ['{{WRAPPER}} .navbar-toggle span' => 'color: {{VALUE}};']
                    ]
                );
                $page->add_control( 'r_energy_page_header_mobile_menu_normal_color',
                    [
                        'label'         => esc_html__( 'Menu Item Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => ['{{WRAPPER}} .navbar-collapse.collapse.in .navbar-nav>li>a' => 'color: {{VALUE}};']
                    ]
                );
                $page->end_controls_tab();
                $page->start_controls_tab('r_energy_page_header_mobile_menu_hover_tab',
                    [ 'label'           => esc_html__( 'Hover', 'r-energy' ) ]
                );
                $page->add_control( 'r_energy_r_energy_page_header_mobile_menu_bar_hvrcolor',
                    [
                        'label'         => esc_html__( 'Menu Bar Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => ['{{WRAPPER}} .navbar-toggle:hover span' => 'color: {{VALUE}};']
                    ]
                );
                $page->add_control( 'r_energy_page_header_mobile_menu_hover_color',
                    [
                        'label'         => esc_html__( 'Menu Item Color', 'r-energy' ),
                        'type'          => Controls_Manager::COLOR,
                        'default'       => '',
                        'selectors'     => ['{{WRAPPER}} .navbar-collapse.collapse.in .navbar-nav>li>a:hover' => 'color: {{VALUE}};']
                    ]
                );
                $page->end_controls_tab();
                $page->end_controls_tabs();
                $page->end_controls_section();
                $page->start_controls_section( 'r_energy_page_footer_widgetize_style_controls_section',
                    [
                        'label'        => esc_html__( 'Page Footer Widgetize Style', 'r-energy' ),
                        'tab'          => Controls_Manager::TAB_STYLE,
                        'condition'     => [
                            'r_energy_hide_page_footer_widgetize!'      => 'yes'
                        ]
                    ]
                );
                $page->add_group_control(
                    Group_Control_Background::get_type(),
                    [
                        'name'          => 'r_energy_page_footer_widgetize_style_background',
                        'label'         => esc_html__( 'Background', 'r-energy' ),
                        'types'         => [ 'classic', 'gradient' ],
                        'selector'      => '{{WRAPPER}} #footer-widget-section'
                    ]
                );
                $page->add_responsive_control( 'r_energy_page_footer_widgetize_style_padding',
                    [
                        'label'         => esc_html__( 'Padding', 'r-energy' ),
                        'type'          => Controls_Manager::DIMENSIONS,
                        'size_units'    => [ 'px', 'em', '%' ],
                        'selectors'     => [ '{{WRAPPER}} #footer-widget-section' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
                        'default'       => [
                            'top'          => '',
                            'right'        => '',
                            'bottom'       => '',
                            'left'         => ''
                        ],
                        'separator'     => 'before'
                    ]
                );
                $page->end_controls_section();
                $page->start_controls_section( 'page_footer_controls_section',
                    [
                        'label'        => esc_html__( 'Page Footer Style', 'r-energy' ),
                        'tab'          => Controls_Manager::TAB_STYLE,
                        'condition'     => [
                            'r_energy_hide_page_footer!'      => 'yes'
                        ]
                    ]
                );
                $page->add_group_control(
                    Group_Control_Background::get_type(),
                    [
                        'name'          => 'page_footer_background',
                        'label'         => esc_html__( 'Background', 'r-energy' ),
                        'types'         => [ 'classic', 'gradient' ],
                        'selector'      => '{{WRAPPER}} #main-footer'
                    ]
                );
                $page->add_responsive_control( 'page_footer_padding',
                    [
                        'label'         => esc_html__( 'Padding', 'r-energy' ),
                        'type'          => Controls_Manager::DIMENSIONS,
                        'size_units'    => [ 'px', 'em', '%' ],
                        'selectors'     => [ '{{WRAPPER}} #main-footer' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};' ],
                        'default'       => [
                            'top'          => '',
                            'right'        => '',
                            'bottom'       => '',
                            'left'         => ''
                        ],
                        'separator'     => 'before'
                    ]
                );
                $page->end_controls_section();
            }
        }
    }
}
R_Energy_Customizing_Page_Settings::get_instance();
